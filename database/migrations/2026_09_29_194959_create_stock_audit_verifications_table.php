<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_audit_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_audit_id')->constrained('stock_audits')->cascadeOnDelete();
            $table->foreignId('verified_by')->constrained('users')->restrictOnDelete();
            $table->string('verification_status', 20)->default('pending')->index();
            $table->text('verification_notes')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index('stock_audit_id');
            $table->index('verified_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_audit_verifications');
    }
};
