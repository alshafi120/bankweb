<?php

namespace Database\Factories;

use App\Modules\Media\Infrastructure\Models\Media;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Media> */
class MediaFactory extends Factory
{
    protected $model = Media::class;

    public function definition(): array
    {
        $name = Str::random(40).'.jpg';

        return [
            'disk' => 'public',
            'path' => 'media/'.$name,
            'filename' => $name,
            'original_name' => fake()->word().'.jpg',
            'mime' => 'image/jpeg',
            'kind' => 'image',
            'size' => 120_000,
            'width' => 1200,
            'height' => 800,
            'alt_ar' => 'صورة',
            'alt_en' => 'Image',
        ];
    }
}
