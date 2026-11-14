<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_audit_items', function (Blueprint $table) {
            $table->foreignId('stock_row_id')
                ->nullable()
                ->after('stock_audit_id')
                ->constrained('stock_rows')
                ->nullOnDelete();

            $table->index('stock_row_id');
        });
    }

    public function down(): void
    {
        Schema::table('stock_audit_items', function (Blueprint $table) {
            $table->dropForeign(['stock_row_id']);
            $table->dropIndex(['stock_row_id']);
            $table->dropColumn('stock_row_id');
        });
    }
};
