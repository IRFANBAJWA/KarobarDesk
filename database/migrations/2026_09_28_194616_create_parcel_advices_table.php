<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parcel_advices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parcel_id')->constrained('parcels')->cascadeOnDelete();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->integer('advice_option');
            $table->integer('reattempt_option')->nullable();
            $table->string('remarks', 400)->nullable();
            $table->string('consignee_address', 255)->nullable();
            $table->string('consignee_no', 50)->nullable();
            $table->string('status', 20)->default('pending')->index();
            $table->string('response_reference', 255)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('parcel_id');
            $table->index('company_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parcel_advices');
    }
};
