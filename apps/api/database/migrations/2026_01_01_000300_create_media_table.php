<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('disk', 30);            // public | s3 | url (pre-existing static asset)
            $table->string('path', 500);
            $table->string('filename', 255);       // random stored name
            $table->string('original_name', 255);
            $table->string('mime', 120);
            $table->string('kind', 20)->index();   // image | video | pdf | document
            $table->unsignedBigInteger('size')->default(0);
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('alt_ar', 255)->nullable();
            $table->string('alt_en', 255)->nullable();
            $table->string('checksum', 64)->nullable()->index();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
