<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_item_status', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->string('display_status', 20)->default('in_store')->index();
            $table->timestamp('displayed_at')->nullable();
            $table->foreignId('displayed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['company_id', 'item_id']);
            $table->index('company_id');
            $table->index('item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_item_status');
    }
};
