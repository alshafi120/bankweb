<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cities', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 80)->unique();
            $table->string('name_ar', 120);
            $table->string('name_en', 120);
            $table->string('governorate_ar', 120)->nullable();
            $table->string('governorate_en', 120)->nullable();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->timestamps();
        });

        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->string('title_ar', 255);
            $table->string('title_en', 255);
            $table->text('summary_ar')->nullable();
            $table->text('summary_en')->nullable();
            $table->string('template', 20)->default('default'); // default | home
            $table->string('status', 20)->default('draft')->index();
            $table->timestamp('publish_at')->nullable()->index();
            $table->timestamp('published_at')->nullable();
            $this->audit($table);
        });

        Schema::create('page_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('page_id')->constrained()->cascadeOnDelete();
            $table->string('type', 40);            // BlockType or home:<HomeSectionType>
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->json('data');
            $table->timestamps();
            $table->index(['page_id', 'position']);
        });

        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->string('icon', 30);
            $table->string('title_ar', 255);
            $table->string('title_en', 255);
            $table->text('summary_ar')->nullable();
            $table->text('summary_en')->nullable();
            $table->longText('body_ar')->nullable();
            $table->longText('body_en')->nullable();
            $table->string('href', 255);
            $table->unsignedInteger('position')->default(0)->index();
            $table->string('status', 20)->default('active')->index();
            $this->audit($table);
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->string('account_type', 20)->index();
            $table->string('name_ar', 255);
            $table->string('name_en', 255);
            $table->string('tagline_ar', 255)->nullable();
            $table->string('tagline_en', 255)->nullable();
            $table->json('features_ar')->nullable();
            $table->json('features_en')->nullable();
            $table->json('requirements_ar')->nullable();
            $table->json('requirements_en')->nullable();
            $table->unsignedBigInteger('minimum_balance')->nullable();
            $table->string('currency', 3)->default('YER');
            $table->unsignedInteger('position')->default(0)->index();
            $table->string('status', 20)->default('active')->index();
            $this->audit($table);
        });

        Schema::create('financing_products', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->string('name_ar', 255);
            $table->string('name_en', 255);
            $table->text('summary_ar')->nullable();
            $table->text('summary_en')->nullable();
            $table->longText('body_ar')->nullable();
            $table->longText('body_en')->nullable();
            $table->unsignedBigInteger('max_amount');
            $table->unsignedSmallInteger('max_months');
            $table->decimal('annual_profit_rate', 5, 2);
            $table->json('requirements_ar')->nullable();
            $table->json('requirements_en')->nullable();
            $table->unsignedInteger('position')->default(0)->index();
            $table->string('status', 20)->default('active')->index();
            $this->audit($table);
        });

        Schema::create('cards', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->string('name_ar', 255);
            $table->string('name_en', 255);
            $table->text('summary_ar')->nullable();
            $table->text('summary_en')->nullable();
            $table->string('network', 20);        // Visa | Mastercard | Local
            $table->string('tone', 20);           // jade | saffron | lapis | graphite
            $table->json('features_ar')->nullable();
            $table->json('features_en')->nullable();
            $table->text('fees_ar')->nullable();
            $table->text('fees_en')->nullable();
            $table->unsignedInteger('position')->default(0)->index();
            $table->string('status', 20)->default('active')->index();
            $this->audit($table);
        });

        Schema::create('news_categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->string('name_ar', 120);
            $table->string('name_en', 120);
            $table->unsignedInteger('position')->default(0)->index();
            $table->timestamps();
        });

        Schema::create('news', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 160)->unique();
            $table->foreignId('news_category_id')->nullable()->constrained('news_categories')->nullOnDelete();
            $table->string('title_ar', 255);
            $table->string('title_en', 255);
            $table->text('excerpt_ar')->nullable();
            $table->text('excerpt_en')->nullable();
            $table->longText('content_ar')->nullable(); // sanitized HTML
            $table->longText('content_en')->nullable();
            $table->foreignId('featured_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('image_url', 500)->nullable(); // optional external/static cover (demo); media wins
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('author_name', 120)->nullable(); // display byline ("Media Office")
            $table->string('status', 20)->default('draft')->index();
            $table->timestamp('publish_at')->nullable()->index();
            $table->timestamp('published_at')->nullable()->index();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_note')->nullable();
            $this->audit($table);
            $table->index(['status', 'published_at']);
        });

        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->string('title_ar', 255);
            $table->string('title_en', 255);
            $table->text('details_ar')->nullable();
            $table->text('details_en')->nullable();
            $table->foreignId('media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('image_url', 500)->nullable();
            $table->string('href', 255)->nullable();
            $table->date('starts_at')->index();
            $table->date('ends_at')->index();
            $table->unsignedInteger('position')->default(0)->index();
            $table->string('status', 20)->default('active')->index();
            $this->audit($table);
        });

        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->string('title_ar', 255);
            $table->string('title_en', 255);
            $table->string('subtitle_ar', 255)->nullable();
            $table->string('subtitle_en', 255)->nullable();
            $table->foreignId('media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('cta_label_ar', 120)->nullable();
            $table->string('cta_label_en', 120)->nullable();
            $table->string('cta_href', 255)->nullable();
            $table->string('placement', 40)->index();
            $table->date('starts_at')->nullable();
            $table->date('ends_at')->nullable();
            $table->unsignedInteger('position')->default(0)->index();
            $table->string('status', 20)->default('active')->index();
            $this->audit($table);
        });

        Schema::create('faq_categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->string('name_ar', 120);
            $table->string('name_en', 120);
            $table->unsignedInteger('position')->default(0)->index();
            $table->timestamps();
        });

        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faq_category_id')->nullable()->constrained('faq_categories')->nullOnDelete();
            $table->string('question_ar', 500);
            $table->string('question_en', 500);
            $table->text('answer_ar');
            $table->text('answer_en');
            $table->boolean('is_featured')->default(false)->index();
            $table->unsignedInteger('position')->default(0)->index();
            $table->string('status', 20)->default('active')->index();
            $this->audit($table);
        });

        foreach (['branches', 'atms', 'agents'] as $name) {
            Schema::create($name, function (Blueprint $table) use ($name) {
                $table->id();
                $table->string('slug', 120)->unique();
                $table->foreignId('city_id')->nullable()->constrained('cities')->nullOnDelete();
                $table->string('name_ar', 255);
                $table->string('name_en', 255);
                $table->string('district_ar', 120)->nullable();
                $table->string('district_en', 120)->nullable();
                $table->string('address_ar', 255)->nullable();
                $table->string('address_en', 255)->nullable();
                $table->string('phone', 40)->nullable();
                $table->string('hours_ar', 120)->nullable();
                $table->string('hours_en', 120)->nullable();
                $table->json('services_ar')->nullable();
                $table->json('services_en')->nullable();
                $table->decimal('lat', 10, 7);
                $table->decimal('lng', 10, 7);
                match ($name) {
                    'branches' => $table->string('manager_name', 120)->nullable(),
                    'atms' => [$table->boolean('is_24h')->default(true), $table->boolean('supports_deposit')->default(false)],
                    'agents' => $table->string('agent_code', 40)->nullable()->unique(),
                };
                $table->unsignedInteger('position')->default(0)->index();
                $table->string('status', 20)->default('active')->index();
                $this->audit($table);
            });
        }

        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 160)->unique();
            $table->string('title_ar', 255);
            $table->string('title_en', 255);
            $table->string('department_ar', 160)->nullable();
            $table->string('department_en', 160)->nullable();
            $table->foreignId('city_id')->nullable()->constrained('cities')->nullOnDelete();
            $table->string('employment_type', 20); // full_time | part_time | contract | internship
            $table->text('summary_ar')->nullable();
            $table->text('summary_en')->nullable();
            $table->longText('description_ar')->nullable();
            $table->longText('description_en')->nullable();
            $table->json('requirements_ar')->nullable();
            $table->json('requirements_en')->nullable();
            $table->date('closes_at')->nullable()->index();
            $table->unsignedInteger('position')->default(0)->index();
            $table->string('status', 20)->default('active')->index(); // active | inactive | closed
            $this->audit($table);
        });

        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->string('location', 20)->unique(); // header | footer
            $table->string('name', 120);
            $table->timestamps();
        });

        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('menu_items')->cascadeOnDelete();
            $table->string('label_ar', 120);
            $table->string('label_en', 120);
            $table->string('href', 255);
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
            $table->index(['menu_id', 'parent_id', 'position']);
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 120)->unique();
            $table->json('value')->nullable();
            $table->string('group', 40)->default('general')->index();
            $table->timestamps();
        });

        Schema::create('seo_metadata', function (Blueprint $table) {
            $table->id();
            $table->nullableMorphs('seoable');
            $table->string('path', 255)->nullable()->unique(); // static routes (/branches, /faq …)
            $table->string('title_ar', 255)->nullable();
            $table->string('title_en', 255)->nullable();
            $table->string('description_ar', 500)->nullable();
            $table->string('description_en', 500)->nullable();
            $table->string('keywords_ar', 500)->nullable();
            $table->string('keywords_en', 500)->nullable();
            $table->string('canonical', 500)->nullable();
            $table->foreignId('og_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->boolean('noindex')->default(false);
            $table->timestamps();
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('title_ar', 255);
            $table->string('title_en', 255);
            $table->foreignId('media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('category', 30)->index(); // report | governance | policy
            $table->unsignedSmallInteger('year')->nullable();
            $table->unsignedInteger('position')->default(0)->index();
            $table->string('status', 20)->default('active')->index();
            $this->audit($table);
        });
    }

    public function down(): void
    {
        foreach (['documents', 'seo_metadata', 'settings', 'menu_items', 'menus', 'jobs', 'agents', 'atms', 'branches',
            'faqs', 'faq_categories', 'banners', 'offers', 'news', 'news_categories', 'cards', 'financing_products',
            'products', 'services', 'page_sections', 'pages', 'cities'] as $table) {
            Schema::dropIfExists($table);
        }
    }

    /** created_at/updated_at + soft delete + created_by/updated_by (docs/DATABASE.md general rules). */
    private function audit(Blueprint $table): void
    {
        $table->timestamps();
        $table->softDeletes();
        $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
        $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
    }
};
