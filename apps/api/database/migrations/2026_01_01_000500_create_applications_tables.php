<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Public requests. These are "intents" captured from the website, NOT banking transactions.
| PII columns (`national_id`, `phone`) are encrypted by the application (TEXT) with an HMAC
| `*_hash` column for exact-match lookup. IPs are only stored as HMAC (`ip_hash`).
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reference_sequences', function (Blueprint $table) {
            $table->string('prefix', 10);
            $table->unsignedSmallInteger('year');
            $table->unsignedBigInteger('last_value')->default(0);
            $table->timestamps();
            $table->primary(['prefix', 'year']);
        });

        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 30)->unique();
            $table->string('type', 20)->index(); // account | financing | card
            $table->string('status', 20)->default('new')->index();
            $table->string('full_name', 120);
            $table->text('national_id');
            $table->string('national_id_hash', 64)->index();
            $table->text('phone');
            $table->string('phone_hash', 64)->index();
            $table->string('email', 160)->nullable();
            $table->string('city', 60)->index();
            $table->string('locale', 2)->default('ar');
            $table->string('account_type', 20)->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->index(['type', 'created_at']);
        });

        Schema::create('financing_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('financing_product_id')->nullable()->constrained('financing_products')->nullOnDelete();
            $table->unsignedBigInteger('amount');
            $table->unsignedSmallInteger('months');
            $table->unsignedBigInteger('monthly_income');
            $table->string('employer', 120)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('card_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('card_id')->nullable()->constrained('cards')->nullOnDelete();
            $table->boolean('has_account')->default(false);
            $table->string('account_last4', 4)->nullable();
            $table->timestamps();
        });

        Schema::create('application_notes', function (Blueprint $table) {
            $table->id();
            $table->morphs('notable');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('contact_requests', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 30)->unique();
            $table->string('status', 20)->default('new')->index();
            $table->string('full_name', 120);
            $table->text('phone');
            $table->string('phone_hash', 64)->index();
            $table->string('email', 160)->nullable();
            $table->string('subject', 20);
            $table->text('message');
            $table->string('preferred_time', 20)->nullable();
            $table->string('locale', 2)->default('ar');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ip_hash', 64)->nullable();
            $table->timestamps();
            $table->index('created_at');
        });

        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 30)->unique();
            $table->string('status', 20)->default('new')->index();
            $table->string('full_name', 120);
            $table->text('phone');
            $table->string('phone_hash', 64)->index();
            $table->string('email', 160)->nullable();
            $table->text('national_id')->nullable();
            $table->string('national_id_hash', 64)->nullable()->index();
            $table->string('category', 20)->index();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->date('transaction_date')->nullable();
            $table->text('description');
            $table->string('attachment_path', 255)->nullable(); // private disk
            $table->string('locale', 2)->default('ar');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->string('ip_hash', 64)->nullable();
            $table->timestamps();
            $table->index('created_at');
        });

        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 30)->unique();
            $table->foreignId('job_id')->constrained('jobs')->cascadeOnDelete();
            $table->string('status', 20)->default('new')->index();
            $table->string('full_name', 120);
            $table->text('phone');
            $table->string('phone_hash', 64)->index();
            $table->string('email', 160);
            $table->string('city', 60);
            $table->string('education', 160);
            $table->unsignedTinyInteger('experience_years')->default(0);
            $table->text('cover_letter')->nullable();
            $table->string('cv_path', 255); // private disk
            $table->string('locale', 2)->default('ar');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ip_hash', 64)->nullable();
            $table->timestamps();
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        foreach (['job_applications', 'complaints', 'contact_requests', 'application_notes', 'card_requests',
            'financing_requests', 'applications', 'reference_sequences'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
