<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 100)->unique()->after('name');
            $table->unsignedBigInteger('company_id')->nullable()->after('username');
            $table->string('erpnext_user', 255)->nullable()->unique()->after('company_id');
            $table->text('erpnext_password')->nullable()->after('erpnext_user');
            $table->text('erpnext_token')->nullable()->after('erpnext_password');
            $table->timestamp('erpnext_last_tested_at')->nullable()->after('erpnext_token');
            $table->text('erpnext_last_error')->nullable()->after('erpnext_last_tested_at');
            $table->boolean('is_active')->default(true)->index()->after('erpnext_last_error');
            $table->timestamp('last_login_at')->nullable()->after('is_active');

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn([
                'username',
                'company_id',
                'erpnext_user',
                'erpnext_password',
                'erpnext_token',
                'erpnext_last_tested_at',
                'erpnext_last_error',
                'is_active',
                'last_login_at',
            ]);
        });
    }
};
