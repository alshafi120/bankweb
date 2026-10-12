<?php

namespace Database\Factories;

use App\Modules\News\Infrastructure\Models\News;
use App\Modules\News\Infrastructure\Models\NewsCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<News> */
class NewsFactory extends Factory
{
    protected $model = News::class;

    public function definition(): array
    {
        $title = fake()->unique()->sentence(5);

        return [
            'title_ar' => 'خبر تجريبي '.fake()->unique()->numberBetween(1, 100000),
            'title_en' => $title,
            'excerpt_ar' => 'ملخص الخبر التجريبي.',
            'excerpt_en' => fake()->sentence(10),
            'content_ar' => '<p>نص الخبر التجريبي.</p>',
            'content_en' => '<p>'.fake()->paragraph().'</p>',
            'news_category_id' => fn () => NewsCategory::query()->value('id') ?? NewsCategory::query()->create(['slug' => 'bank', 'name_ar' => 'أخبار البنك', 'name_en' => 'Bank news'])->id,
            'author_name' => 'Withaq Media Office',
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (News $news) {
            $news->status ??= 'draft';
        });
    }

    public function published(?\DateTimeInterface $at = null): static
    {
        return $this->afterMaking(function (News $news) use ($at) {
            $news->status = 'published';
            $news->published_at = $at ?? now()->subDay();
        });
    }

    public function status(string $status): static
    {
        return $this->afterMaking(fn (News $news) => $news->status = $status);
    }

    public function by(int $authorId): static
    {
        return $this->afterMaking(fn (News $news) => $news->author_id = $authorId);
    }
}
