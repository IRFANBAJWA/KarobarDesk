<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('till_operations', function (Blueprint $table) {
            $table->id();
            $table->string('erpnext_name', 255)->nullable()->unique();
            $table->string('source', 20)->default('erpnext')->index();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->foreignId('price_list_id')->constrained('price_lists')->restrictOnDelete();
            $table->string('price_list', 255);
            $table->string('warehouse', 255)->nullable();
            $table->string('erpnext_role', 50)->nullable();
            $table->string('shop_code', 50)->nullable();
            $table->string('till_no', 50);
            $table->string('shop_name', 255)->nullable();
            $table->text('address')->nullable();
            $table->string('phone', 50)->nullable();
            $table->boolean('is_online')->default(false)->index();
            $table->boolean('allow_rate')->default(false);
            $table->unsignedSmallInteger('return_pin')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('erpnext_modified_at')->nullable();
            $table->string('sync_status', 20)->default('pending')->index();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'till_no']);
            $table->index('company_id');
            $table->index('price_list_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('till_operations');
    }
};
