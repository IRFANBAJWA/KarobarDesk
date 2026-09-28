<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_invoice_id')->constrained('sales_invoices')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items')->restrictOnDelete();
            $table->unsignedInteger('line_number');
            $table->string('item_code', 255);
            $table->string('item_name', 255);
            $table->string('uom', 50)->default('Nos');
            $table->decimal('qty', 15, 3)->default(0);
            $table->decimal('free_qty', 15, 3)->default(0);
            $table->decimal('return_qty', 15, 3)->default(0);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('sale_price', 15, 2)->default(0);
            $table->decimal('cost_price', 15, 2)->nullable();
            $table->decimal('line_discount', 15, 2)->default(0);
            $table->decimal('line_discount_percent', 8, 4)->default(0);
            $table->decimal('tax_rate', 8, 4)->default(0);
            $table->boolean('is_returned')->default(false);
            $table->boolean('is_b')->default(false);
            $table->boolean('is_set')->default(false);
            $table->text('is_b_reason')->nullable();
            $table->text('return_reason')->nullable();
            $table->text('discount_reason')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index('sales_invoice_id');
            $table->index('item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_invoice_items');
    }
};
