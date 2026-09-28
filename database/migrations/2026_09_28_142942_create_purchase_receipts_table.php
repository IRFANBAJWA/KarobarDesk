<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders')->nullOnDelete();
            $table->string('erpnext_po_reference', 255)->nullable();
            $table->string('receipt_number', 50)->nullable()->unique();
            $table->date('receipt_date')->index();
            $table->string('supplier_name', 255)->nullable();
            $table->string('supplier_erpnext_id', 255)->nullable();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('draft')->index();
            $table->string('erpnext_pr_reference', 255)->nullable()->index();
            $table->string('erpnext_status', 50)->nullable();
            $table->string('sync_status', 20)->default('pending')->index();
            $table->text('sync_error')->nullable();
            $table->unsignedInteger('sync_attempts')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('company_id');
            $table->index('purchase_order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_receipts');
    }
};
