<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rejected_sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rejected_sale_id')->constrained('rejected_sales')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->string('item_code', 255);
            $table->string('item_name', 255);
            $table->string('uom', 50)->nullable();
            $table->decimal('qty', 15, 3);
            $table->decimal('unit_price', 15, 2)->nullable();
            $table->decimal('line_discount', 15, 2)->nullable();
            $table->decimal('line_total', 15, 2)->nullable();
            $table->boolean('was_problem_item')->default(false);
            $table->timestamps();

            $table->index('rejected_sale_id');
            $table->index('item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rejected_sale_items');
    }
};