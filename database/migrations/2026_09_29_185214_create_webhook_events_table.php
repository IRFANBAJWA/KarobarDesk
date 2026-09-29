<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_events', function (Blueprint $table) {
            $table->id();
            $table->string('source', 50)->default('erpnext');
            $table->string('doctype', 100)->index();
            $table->string('document_name', 255)->index();
            $table->string('event', 50);
            $table->timestamp('modified_at')->nullable();
            $table->string('fingerprint', 64)->unique();
            $table->text('payload')->nullable();
            $table->timestamp('received_at')->index();
            $table->timestamp('processed_at')->nullable();
            $table->string('status', 20)->default('pending')->index();
            $table->text('error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_events');
    }
};
