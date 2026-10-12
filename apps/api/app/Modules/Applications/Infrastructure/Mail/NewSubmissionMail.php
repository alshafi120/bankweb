<?php

namespace App\Modules\Applications\Infrastructure\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** Minimal staff notification. Reference + type + dashboard link; no personal data in e-mail. */
class NewSubmissionMail extends Mailable
{
    use Queueable;

    public function __construct(
        public readonly string $reference,
        public readonly string $type,
        public readonly string $kind,
        public readonly int $recordId,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "طلب جديد / New request {$this->reference}");
    }

    public function content(): Content
    {
        $link = rtrim((string) config('app.admin_url'), '/')."/inbox/{$this->kind}/{$this->recordId}";

        return new Content(
            htmlString: '<p dir="rtl">تم استلام طلب جديد من الموقع.</p>'
                .'<p>New website request received.</p>'
                .'<p><strong>'.e($this->reference).'</strong> — '.e($this->type).'</p>'
                .'<p><a href="'.e($link).'">'.e($link).'</a></p>',
        );
    }
}
