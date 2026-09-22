<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('erpnext_item_code', 255)->unique();
            $table->string('item_name', 255);
            $table->string('item_group', 255)->nullable()->index();
            $table->string('brand', 255)->nullable();
            $table->string('uom', 50)->nullable();
            $table->string('barcode', 255)->nullable()->index();
            $table->string('alias', 255)->nullable();
            $table->text('description')->nullable();
            $table->decimal('weight', 15, 3)->nullable();
            $table->string('weight_uom', 20)->nullable();
            $table->decimal('cost_price', 15, 2)->nullable();
            $table->decimal('standard_rate', 15, 2)->nullable();
            $table->decimal('last_purchase_rate', 15, 2)->nullable();
            $table->decimal('average_rate', 15, 2)->nullable();
            $table->decimal('tax_rate', 8, 4)->nullable();
            $table->boolean('is_stock_item')->default(true);
            $table->boolean('is_taxable')->default(false);
            $table->boolean('is_active')->default(true)->index();
            $table->boolean('has_variants')->default(false);
            $table->string('woocommerce_id', 50)->nullable();
            $table->timestamp('erpnext_modified_at')->nullable();
            $table->string('sync_status', 20)->default('pending')->index();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
