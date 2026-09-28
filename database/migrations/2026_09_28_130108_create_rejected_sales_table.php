<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rejected_sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('till_operation_id')->nullable()->constrained('till_operations')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->unsignedBigInteger('shift_id')->nullable(); // FK added later
            $table->string('client_request_id', 100);
            $table->string('invoice_number', 50);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->string('rejection_reason', 255);
            $table->string('status', 20)->default('pending')->index();
            $table->unsignedBigInteger('sales_invoice_id')->nullable(); // FK added later
            $table->string('sync_status', 20)->default('pending')->index();
            $table->timestamp('synced_to_pos_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->text('payload_snapshot')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'client_request_id']);
            $table->index('company_id');
            $table->index('shift_id');
            $table->index('sales_invoice_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rejected_sales');
    }
};
