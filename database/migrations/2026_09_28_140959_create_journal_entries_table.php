<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('entry_number', 50)->nullable()->unique();
            $table->date('posting_date')->index();
            $table->string('voucher_type', 50)->default('Journal Entry');
            $table->string('title', 255)->nullable();
            $table->text('user_remark')->nullable();
            $table->decimal('total_debit', 15, 2)->default(0);
            $table->decimal('total_credit', 15, 2)->default(0);
            $table->string('erpnext_jv_reference', 255)->nullable()->index();
            $table->string('erpnext_jv_status', 50)->nullable();
            $table->string('sync_status', 20)->default('pending')->index();
            $table->text('sync_error')->nullable();
            $table->unsignedInteger('sync_attempts')->default(0);
            $table->timestamps();

            $table->index('company_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_entries');
    }
};
