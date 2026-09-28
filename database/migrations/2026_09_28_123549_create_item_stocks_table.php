<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('warehouse', 255);
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->decimal('qty', 15, 3)->default(0);
            $table->timestamps();

            $table->unique(['company_id', 'warehouse', 'item_id']);
            $table->index('company_id');
            $table->index('item_id');
            $table->index(['company_id', 'item_id']);
        });

        // Check constraint: qty >= 0
        DB::statement('ALTER TABLE item_stocks ADD CONSTRAINT item_stocks_qty_non_negative CHECK (qty >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('item_stocks');
    }
};
