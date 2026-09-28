<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courier_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('courier_partner_id')->constrained('courier_partners')->restrictOnDelete();
            $table->string('account_name', 255);
            $table->string('username', 50);
            $table->text('password')->nullable();
            $table->string('account_no', 50);
            $table->string('location_id', 10)->nullable();
            $table->string('return_location', 10)->nullable();
            $table->string('insert_type', 10)->nullable();
            $table->string('sub_account_id', 10)->nullable();
            $table->boolean('is_default')->default(false)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();

            $table->index('company_id');
            $table->index('courier_partner_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courier_accounts');
    }
};
