<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('day_closings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('till_operation_id')->nullable()->constrained('till_operations')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('closing_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('business_date');
            $table->unsignedInteger('shift_count')->default(0);
            $table->unsignedInteger('total_transactions')->default(0);
            $table->unsignedInteger('sale_count')->default(0);
            $table->unsignedInteger('return_count')->default(0);
            $table->unsignedInteger('void_count')->default(0);
            $table->decimal('total_sales', 15, 2)->default(0);
            $table->decimal('cash_sales', 15, 2)->default(0);
            $table->decimal('card_sales', 15, 2)->default(0);
            $table->decimal('other_sales', 15, 2)->default(0);
            $table->decimal('total_discount', 15, 2)->default(0);
            $table->decimal('total_tax', 15, 2)->default(0);
            $table->decimal('total_returns', 15, 2)->default(0);
            $table->decimal('total_expenses', 15, 2)->default(0);
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->decimal('closing_balance', 15, 2)->default(0);
            $table->decimal('expected_cash', 15, 2)->default(0);
            $table->decimal('actual_cash', 15, 2)->default(0);
            $table->decimal('cash_difference', 15, 2)->default(0);
            $table->dateTime('closing_time')->nullable();
            $table->string('status', 20)->default('CLOSED')->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'till_operation_id', 'business_date']);
            $table->index('company_id');
            $table->index('business_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('day_closings');
    }
};
