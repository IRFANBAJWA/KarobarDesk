<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parcel_settlement_imports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('courier_account_id')->nullable()->constrained('courier_accounts')->nullOnDelete();
            $table->string('source', 20)->default('scrape');
            $table->string('file_path', 255)->nullable();
            $table->string('file_format', 20)->nullable();
            $table->date('period_from')->nullable();
            $table->date('period_to')->nullable();
            $table->unsignedInteger('rows_received')->default(0);
            $table->unsignedInteger('rows_inserted')->default(0);
            $table->unsignedInteger('rows_updated')->default(0);
            $table->unsignedInteger('rows_unmatched')->default(0);
            $table->string('status', 20)->default('success')->index();
            $table->text('error')->nullable();
            $table->string('triggered_by', 20)->nullable();
            $table->foreignId('imported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('company_id');
            $table->index('courier_account_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parcel_settlement_imports');
    }
};
