<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_row_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->foreignId('stock_row_id')->constrained('stock_rows')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['company_id', 'item_id']);
            $table->index(['company_id', 'stock_row_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_row_assignments');
    }
};
