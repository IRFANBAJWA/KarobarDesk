<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items')->restrictOnDelete();
            $table->string('erpnext_item_code', 255);
            $table->string('item_name', 255)->nullable();
            $table->string('uom', 50)->nullable();
            $table->decimal('qty', 15, 3)->default(0);
            $table->decimal('received_qty', 15, 3)->default(0);
            $table->decimal('pending_qty', 15, 3)->default(0);
            $table->decimal('rate', 15, 2)->nullable();
            $table->string('warehouse', 255)->nullable();
            $table->string('erpnext_line_reference', 255)->nullable();
            $table->timestamps();

            $table->index('purchase_order_id');
            $table->index('item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_items');
    }
};
