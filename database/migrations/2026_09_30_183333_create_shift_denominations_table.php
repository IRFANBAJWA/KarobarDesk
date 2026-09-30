<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shift_denominations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shift_id')->constrained('shifts')->cascadeOnDelete();
            $table->string('denomination_type', 20)->default('OPENING');
            $table->unsignedInteger('d5000')->default(0);
            $table->unsignedInteger('d1000')->default(0);
            $table->unsignedInteger('d500')->default(0);
            $table->unsignedInteger('d100')->default(0);
            $table->unsignedInteger('d50')->default(0);
            $table->unsignedInteger('d20')->default(0);
            $table->unsignedInteger('d10')->default(0);
            $table->unsignedInteger('d5')->default(0);
            $table->unsignedInteger('d2')->default(0);
            $table->unsignedInteger('d1')->default(0);
            $table->unsignedInteger('c50')->default(0);
            $table->unsignedInteger('c25')->default(0);
            $table->unsignedInteger('c10')->default(0);
            $table->unsignedInteger('c5')->default(0);
            $table->unsignedInteger('c1')->default(0);
            $table->timestamps();

            $table->unique(['shift_id', 'denomination_type']);
            $table->index('shift_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_denominations');
    }
};
