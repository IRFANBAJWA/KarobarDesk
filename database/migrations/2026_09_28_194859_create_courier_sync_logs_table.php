<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courier_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->foreignId('courier_account_id')->nullable()->constrained('courier_accounts')->nullOnDelete();
            $table->foreignId('parcel_id')->nullable()->constrained('parcels')->nullOnDelete();
            $table->string('operation', 50)->index();
            $table->string('endpoint', 255)->nullable();
            $table->string('request_reference', 255)->nullable();
            $table->string('response_reference', 255)->nullable();
            $table->string('order_reference_id', 50)->nullable();
            $table->string('status', 20)->default('pending')->index();
            $table->text('error')->nullable();
            $table->unsignedInteger('retry_count')->default(0);
            $table->timestamps();

            $table->index('company_id');
            $table->index('courier_account_id');
            $table->index('parcel_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courier_sync_logs');
    }
};
