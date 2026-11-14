<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Keep earliest row per (stock_audit_item_id, role_area); delete the rest.
        DB::statement("
            DELETE c1 FROM stock_audit_counts c1
            INNER JOIN stock_audit_counts c2
                ON c1.stock_audit_item_id = c2.stock_audit_item_id
                AND c1.role_area = c2.role_area
                AND c1.id > c2.id
        ");

        Schema::table('stock_audit_counts', function (Blueprint $table) {
            $table->dropUnique('stock_audit_counts_stock_audit_item_id_user_id_unique');
        });

        Schema::table('stock_audit_counts', function (Blueprint $table) {
            $table->unique(['stock_audit_item_id', 'role_area'], 'stock_audit_counts_item_area_unique');
        });
    }

    public function down(): void
    {
        Schema::table('stock_audit_counts', function (Blueprint $table) {
            $table->dropUnique('stock_audit_counts_item_area_unique');
        });

        Schema::table('stock_audit_counts', function (Blueprint $table) {
            $table->unique(['stock_audit_item_id', 'user_id'], 'stock_audit_counts_stock_audit_item_id_user_id_unique');
        });
    }
};
