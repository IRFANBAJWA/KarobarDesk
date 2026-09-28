<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_invoice_id')->constrained('sales_invoices')->cascadeOnDelete();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('accounts')->restrictOnDelete();
            $table->string('erpnext_account', 255)->nullable();
            $table->string('payment_method', 50);
            $table->decimal('payment_amount', 15, 2);
            $table->string('reference_number', 100)->nullable();
            $table->string('card_last_4', 4)->nullable();
            $table->string('card_type', 50)->nullable();
            $table->date('payment_date')->index();
            $table->time('payment_time');
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('sales_invoice_id');
            $table->index('company_id');
            $table->index('account_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
