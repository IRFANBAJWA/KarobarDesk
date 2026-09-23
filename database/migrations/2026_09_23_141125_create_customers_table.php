<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('erpnext_customer', 255)->unique();
            $table->string('customer_name', 255);
            $table->string('customer_type', 50)->nullable();
            $table->string('phone', 50)->nullable()->index();
            $table->string('email', 255)->nullable();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('country', 100)->nullable();
            $table->decimal('credit_limit', 15, 2)->nullable();
            $table->decimal('current_balance', 15, 2)->nullable()->default(0);
            $table->string('tax_number', 100)->nullable();
            $table->string('loyalty_card_number', 100)->nullable()->index();
            $table->boolean('loyalty_member')->default(false);
            $table->decimal('special_discount', 8, 4)->nullable();
            $table->decimal('loyalty_points', 15, 2)->nullable()->default(0);
            $table->string('loyalty_program', 255)->nullable();
            $table->date('loyalty_expiry')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('erpnext_modified_at')->nullable();
            $table->string('sync_status', 20)->default('pending')->index();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
