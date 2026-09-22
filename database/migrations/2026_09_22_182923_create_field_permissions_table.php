<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('field_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->string('form', 50);
            $table->string('field', 50);
            $table->boolean('can_view')->default(true);
            $table->boolean('can_edit')->default(false);
            $table->timestamps();

            $table->unique(['role_id', 'form', 'field']);
            $table->index('role_id');
            $table->index(['form', 'field']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('field_permissions');
    }
};
