<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CourierPartnerSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('courier_partners')->updateOrInsert(
            ['code' => 'mnp'],
            [
                'name' => 'M&P Courier',
                'api_base_url' => 'https://mnpcourier.com/mycodapi/api',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}
