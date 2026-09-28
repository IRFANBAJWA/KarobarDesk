<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('erpnext_po_reference', 255)->unique();
            $table->string('supplier_name', 255)->nullable();
            $table->string('supplier_erpnext_id', 255)->nullable();
            $table->date('transaction_date')->nullable();
            $table->date('delivery_date')->nullable();
            $table->string('status', 50)->nullable()->index();
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->string('currency', 10)->nullable();
            $table->timestamp('erpnext_modified_at')->nullable();
            $table->string('sync_status', 20)->default('pending')->index();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->index('company_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
