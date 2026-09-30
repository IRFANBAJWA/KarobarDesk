<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('till_operation_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('till_operation_id')->constrained('till_operations')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('accounts')->restrictOnDelete();
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->unique(['till_operation_id', 'account_id']);
            $table->index('till_operation_id');
            $table->index('account_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('till_operation_accounts');
    }
};
