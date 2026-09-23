<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('erpnext_account', 255)->nullable();
            $table->string('source', 20)->default('erpnext')->index();
            $table->string('name', 255);
            $table->string('account_type', 50)->index();
            $table->boolean('is_group')->default(false);
            $table->boolean('is_disabled')->default(false)->index();
            $table->timestamp('erpnext_modified_at')->nullable();
            $table->string('sync_status', 20)->default('pending')->index();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'erpnext_account']);
            $table->index('company_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
