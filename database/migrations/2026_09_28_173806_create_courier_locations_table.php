<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courier_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('courier_account_id')->constrained('courier_accounts')->cascadeOnDelete();
            $table->string('location_id', 10);
            $table->string('location_name', 50);
            $table->string('location_address', 255)->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->unique(['courier_account_id', 'location_id']);
            $table->index('courier_account_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courier_locations');
    }
};
