<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parcel_settlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parcel_id')->nullable()->constrained('parcels')->nullOnDelete();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('courier_account_id')->nullable()->constrained('courier_accounts')->nullOnDelete();
            $table->string('cn_number', 50)->index();
            $table->date('settlement_date')->nullable();
            $table->decimal('cod_amount', 15, 2)->default(0);
            $table->decimal('courier_charge', 15, 2)->default(0);
            $table->decimal('courier_gst', 15, 2)->default(0);
            $table->decimal('courier_total', 15, 2)->default(0);
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('net_payable', 15, 2)->default(0);
            $table->string('tracking', 100)->nullable();
            $table->string('payment_id', 100)->nullable();
            $table->string('instrument_mode', 50)->nullable();
            $table->string('instrument_number', 100)->nullable();
            $table->string('source', 20)->default('scrape')->index();
            $table->text('raw_data')->nullable();
            $table->timestamps();

            $table->unique(['cn_number', 'settlement_date']);
            $table->index('company_id');
            $table->index('parcel_id');
            $table->index('courier_account_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parcel_settlements');
    }
};
