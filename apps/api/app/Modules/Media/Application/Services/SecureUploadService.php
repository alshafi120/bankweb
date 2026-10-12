<?php

namespace App\Modules\Media\Application\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * Hardened file intake for every upload (public forms and admin media):
 *  1. size ≤ limit (5 MB for applicant files),
 *  2. extension allow-list AND real MIME from finfo (magic bytes) must both match,
 *  3. random file name (never the client name) on the target disk,
 *  4. raster images are decoded and re-encoded with GD → strips EXIF/GPS metadata and any payload
 *     appended to the image,
 *  5. applicant files go to the `private` disk (outside the web root, served only via signed URLs).
 * Antivirus scanning hooks in at scan() (ClamAV daemon in production; no-op when CLAMAV_SOCKET is empty).
 */
class SecureUploadService
{
    /** MIME (from finfo) → allowed extensions. */
    public const DOCUMENT_TYPES = [
        'application/pdf' => ['pdf'],
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png' => ['png'],
    ];

    public const PDF_ONLY = ['application/pdf' => ['pdf']];

    public const MEDIA_TYPES = [
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png' => ['png'],
        'image/webp' => ['webp'],
        'application/pdf' => ['pdf'],
        'video/mp4' => ['mp4'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => ['docx'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => ['xlsx'],
    ];

    private const REENCODABLE = ['image/jpeg', 'image/png', 'image/webp'];

    /**
     * @param  array<string, list<string>>  $allowed
     * @return array{path: string, disk: string, mime: string, size: int, width: ?int, height: ?int, checksum: string, extension: string, original: string}
     */
    public function store(UploadedFile $file, string $field, string $disk, string $directory, array $allowed, int $maxBytes): array
    {
        if (! $file->isValid()) {
            $this->fail($field, 'The upload failed.');
        }
        $size = (int) $file->getSize();
        if ($size <= 0 || $size > $maxBytes) {
            $this->fail($field, 'The file is too large.');
        }

        $mime = $this->realMime($file->getRealPath());
        $extension = Str::lower($file->getClientOriginalExtension());
        if (! isset($allowed[$mime]) || ! in_array($extension, $allowed[$mime], true)) {
            $this->fail($field, 'The file type is not allowed.');
        }

        $this->scan($file->getRealPath(), $field);

        $width = $height = null;
        $contents = null;
        if (in_array($mime, self::REENCODABLE, true)) {
            [$contents, $width, $height] = $this->reencode($file->getRealPath(), $mime, $field);
        }

        $name = Str::random(40).'.'.$allowed[$mime][0];
        $path = trim($directory, '/').'/'.now()->format('Y/m').'/'.$name;

        $stored = $contents !== null
            ? Storage::disk($disk)->put($path, $contents)
            : Storage::disk($disk)->putFileAs(dirname($path), $file, basename($path));
        if (! $stored) {
            throw new RuntimeException('Could not store upload.');
        }

        return [
            'path' => $path,
            'disk' => $disk,
            'mime' => $mime,
            'size' => $contents !== null ? strlen($contents) : $size,
            'width' => $width,
            'height' => $height,
            'checksum' => $contents !== null ? hash('sha256', $contents) : (string) hash_file('sha256', $file->getRealPath()),
            'extension' => $allowed[$mime][0],
            'original' => Str::limit(preg_replace('/[^\pL\pN._ -]/u', '_', $file->getClientOriginalName()) ?? 'file', 200, ''),
        ];
    }

    public function realMime(string $path): string
    {
        $finfo = new \finfo(FILEINFO_MIME_TYPE);

        return (string) $finfo->file($path);
    }

    /**
     * Decode + re-encode (strips metadata). Images larger than 40 MP are rejected (decompression bombs).
     *
     * @return array{0: string, 1: int, 2: int}
     */
    private function reencode(string $path, string $mime, string $field): array
    {
        $info = @getimagesize($path);
        if ($info === false || $info[0] < 1 || $info[1] < 1 || $info[0] * $info[1] > 40_000_000) {
            $this->fail($field, 'The image could not be processed.');
        }

        $image = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($path),
            'image/png' => @imagecreatefrompng($path),
            'image/webp' => @imagecreatefromwebp($path),
        };
        if (! $image) {
            $this->fail($field, 'The image could not be processed.');
        }

        ob_start();
        $ok = match ($mime) {
            'image/jpeg' => imagejpeg($image, null, 85),
            'image/png' => (function () use ($image) {
                imagesavealpha($image, true);

                return imagepng($image, null, 6);
            })(),
            'image/webp' => imagewebp($image, null, 82),
        };
        $out = (string) ob_get_clean();
        $width = imagesx($image);
        $height = imagesy($image);
        imagedestroy($image);

        if (! $ok || $out === '') {
            $this->fail($field, 'The image could not be processed.');
        }

        return [$out, $width, $height];
    }

    /** ClamAV INSTREAM scan when CLAMAV_SOCKET is configured (e.g. unix:///var/run/clamav/clamd.ctl). */
    private function scan(string $path, string $field): void
    {
        $socket = (string) config('bank.clamav_socket', '');
        if ($socket === '') {
            return;
        }

        $conn = @stream_socket_client($socket, $errno, $errstr, 5);
        if (! $conn) {
            throw new RuntimeException('Antivirus unavailable.');
        }
        fwrite($conn, "zINSTREAM\0");
        $fh = fopen($path, 'rb');
        while (! feof($fh)) {
            $chunk = (string) fread($fh, 8192);
            fwrite($conn, pack('N', strlen($chunk)).$chunk);
        }
        fclose($fh);
        fwrite($conn, pack('N', 0));
        $result = trim((string) fgets($conn));
        fclose($conn);

        if (! str_ends_with($result, 'OK')) {
            $this->fail($field, 'The file was rejected.');
        }
    }

    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => [$message]]);
    }
}
