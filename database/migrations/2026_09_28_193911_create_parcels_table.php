<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parcels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('courier_account_id')->nullable()->constrained('courier_accounts')->nullOnDelete();
            $table->foreignId('sales_invoice_id')->nullable()->constrained('sales_invoices')->nullOnDelete();
            $table->string('cn_number', 50)->nullable()->unique();
            $table->string('customer_reference', 50)->nullable()->index();
            $table->string('booking_status', 20)->default('pending')->index();
            $table->boolean('active_parcel')->default(true);

            $table->string('consignee_name', 50)->nullable();
            $table->string('consignee_address', 255)->nullable();
            $table->string('consignee_mobile', 50)->nullable();
            $table->string('consignee_email', 50)->nullable();
            $table->string('destination_city', 50)->nullable();
            $table->unsignedInteger('pieces')->default(1);
            $table->decimal('weight', 10, 3)->nullable();
            $table->decimal('cod_amount', 15, 2)->default(0);
            $table->string('product_description', 50)->nullable();
            $table->string('fragile', 5)->nullable();
            $table->string('service_type', 50)->nullable();
            $table->string('remarks', 400)->nullable();
            $table->string('insurance_value', 50)->nullable();
            $table->string('location_id', 10)->nullable();
            $table->string('return_location', 10)->nullable();

            $table->string('qsr_org_zone', 50)->nullable();
            $table->string('qsr_org_branch', 50)->nullable();
            $table->string('qsr_dest_zone', 50)->nullable();
            $table->string('qsr_dest_branch', 50)->nullable();
            $table->string('qsr_received_by', 100)->nullable();
            $table->string('qsr_delivery_time', 20)->nullable();
            $table->date('qsr_delivery_date')->nullable();
            $table->string('qsr_payment_mode', 20)->nullable();
            $table->string('qsr_rr_status', 50)->nullable();
            $table->string('qsr_cheque_no', 50)->nullable();

            $table->string('current_status', 100)->nullable()->index();
            $table->timestamp('last_tracking_at')->nullable();
            $table->string('last_location', 255)->nullable();
            $table->boolean('attention_required')->default(false)->index();
            $table->string('attention_reason', 255)->nullable();

            $table->date('booking_date')->nullable();
            $table->dateTime('booking_datetime')->nullable();
            $table->foreignId('booked_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('sync_status', 20)->default('pending')->index();
            $table->text('sync_error')->nullable();
            $table->unsignedInteger('sync_attempts')->default(0);

            $table->timestamps();

            $table->index('company_id');
            $table->index('courier_account_id');
            $table->index('sales_invoice_id');
            $table->index('booking_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parcels');
    }
};
