<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('till_operation_id')->nullable()->constrained('till_operations')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('client_request_id', 100);
            $table->string('invoice_number', 50);
            $table->string('invoice_type', 20)->default('sale')->index();
            $table->string('status', 20)->default('unpaid')->index();
            $table->string('erpnext_status', 50)->nullable();
            $table->string('erpnext_invoice_reference', 255)->nullable()->index();
            $table->foreignId('original_invoice_id')->nullable()->constrained('sales_invoices')->nullOnDelete();
            $table->date('invoice_date')->index();
            $table->time('invoice_time');
            $table->date('working_date')->nullable()->index();
            $table->date('due_date')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('discount_percentage', 8, 4)->nullable();
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('shipping_amount', 15, 2)->default(0);
            $table->decimal('rounding_adjustment', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->decimal('total_paid', 15, 2)->default(0);
            $table->text('discount_reason')->nullable();
            $table->unsignedInteger('item_count')->default(0);
            $table->boolean('is_void')->default(false);
            $table->text('void_reason')->nullable();
            $table->foreignId('void_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('void_time')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('cancel_reason')->nullable();
            $table->text('return_reason')->nullable();
            $table->unsignedBigInteger('source_rejected_sale_id')->nullable()->index();
            $table->string('sync_status', 20)->default('pending')->index();
            $table->text('sync_error')->nullable();
            $table->unsignedInteger('sync_attempts')->default(0);
            $table->integer('pos_sync_status')->nullable();
            $table->string('pos_erpnext_sync_status', 50)->nullable();
            $table->string('fbr_invoice_reference', 255)->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'client_request_id']);
            $table->unique(['company_id', 'invoice_number']);
            $table->index('company_id');
            $table->index('till_operation_id');
            $table->index('user_id');
            $table->index('customer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_invoices');
    }
};
