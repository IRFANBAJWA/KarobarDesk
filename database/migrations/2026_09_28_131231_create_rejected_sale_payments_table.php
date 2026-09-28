<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rejected_sale_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rejected_sale_id')->constrained('rejected_sales')->cascadeOnDelete();
            $table->foreignId('account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->string('erpnext_account', 255)->nullable();
            $table->string('payment_method', 50);
            $table->decimal('payment_amount', 15, 2);
            $table->string('reference_number', 100)->nullable();
            $table->string('card_last_4', 4)->nullable();
            $table->string('card_type', 50)->nullable();
            $table->timestamps();

            $table->index('rejected_sale_id');
            $table->index('account_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rejected_sale_payments');
    }
};
