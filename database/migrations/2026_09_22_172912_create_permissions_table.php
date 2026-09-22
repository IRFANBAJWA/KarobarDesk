<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('module', 50);
            $table->string('action', 50);
            $table->string('label', 150);
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(true);
            $table->timestamps();

            $table->unique(['module', 'action']);
            $table->index('module');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};
