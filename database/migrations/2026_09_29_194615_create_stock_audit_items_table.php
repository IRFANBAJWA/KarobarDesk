<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_audit_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_audit_id')->constrained('stock_audits')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items')->restrictOnDelete();
            $table->decimal('system_qty', 15, 3)->default(0);
            $table->decimal('total_counted_qty', 15, 3)->default(0);
            $table->decimal('difference', 15, 3)->default(0);
            $table->text('discrepancy_reason')->nullable();
            $table->string('decision', 50)->nullable();
            $table->timestamps();

            $table->unique(['stock_audit_id', 'item_id']);
            $table->index('stock_audit_id');
            $table->index('item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_audit_items');
    }
};
