<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /* Append-only. The application never updates or deletes rows (see AuditLog model). */
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 40)->index();
            $table->string('resource_type', 60)->nullable();
            $table->string('resource_id', 60)->nullable();
            $table->string('resource_label', 255)->nullable();
            $table->json('changes')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'created_at']);
            $table->index(['resource_type', 'resource_id']);
            $table->index('created_at');
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description', 255);
            $table->json('properties')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('page_views', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('path', 300);
            $table->string('referrer_host', 190)->nullable();
            $table->string('source', 20)->index(); // direct | search | social | referral
            $table->string('visitor_hash', 64);
            $table->index(['date', 'path']);
            $table->index(['date', 'visitor_hash']);
        });

        Schema::create('service_views', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('service_key', 120);
            $table->unsignedInteger('count')->default(0);
            $table->unique(['date', 'service_key']);
        });

        /*
        | Transactional outbox for the (future) Integration Layer. v1 only WRITES here; a separate,
        | network-isolated integration service would relay rows to core banking / SMS / KYC.
        */
        Schema::create('integration_outbox', function (Blueprint $table) {
            $table->id();
            $table->string('port', 40)->index();
            $table->string('operation', 80);
            $table->json('payload');
            $table->string('status', 20)->default('pending')->index(); // pending | processing | done | failed
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('available_at')->useCurrent()->index();
            $table->timestamp('processed_at')->nullable();
            $table->text('last_error')->nullable();
            $table->string('idempotency_key', 100)->nullable()->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['integration_outbox', 'service_views', 'page_views', 'activity_logs', 'audit_logs'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
