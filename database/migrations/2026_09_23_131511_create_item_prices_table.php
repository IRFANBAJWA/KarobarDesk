<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('price_list_id')->constrained('price_lists')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->decimal('rate', 15, 2)->default(0);
            $table->decimal('pack_rate', 15, 2)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('erpnext_modified_at')->nullable();
            $table->string('sync_status', 20)->default('pending')->index();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique(['price_list_id', 'item_id']);
            $table->index('price_list_id');
            $table->index('item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_prices');
    }
};
