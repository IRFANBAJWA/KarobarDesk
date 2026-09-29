<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_audit_counts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_audit_item_id')->constrained('stock_audit_items')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('role_area', 50);
            $table->decimal('physical_qty', 15, 3)->default(0);
            $table->text('remarks')->nullable();
            $table->timestamp('entered_at')->nullable();
            $table->timestamps();

            $table->unique(['stock_audit_item_id', 'user_id']);
            $table->index('stock_audit_item_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_audit_counts');
    }
};
