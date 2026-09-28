<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parcel_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parcel_id')->constrained('parcels')->cascadeOnDelete();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('tracking_tag_id', 50)->nullable();
            $table->dateTime('tracking_datetime')->index();
            $table->string('location', 255)->nullable();
            $table->string('status', 255);
            $table->text('detail')->nullable();
            $table->string('event', 255)->nullable();
            $table->string('fingerprint', 64)->unique();
            $table->timestamps();

            $table->index('parcel_id');
            $table->index('company_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parcel_status_history');
    }
};
