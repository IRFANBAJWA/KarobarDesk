<?php

use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\MeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| All KarobarDesk API routes. POS (IBPOS) uses bearer tokens via Sanctum.
| React SPA uses session cookies via Sanctum. Both share this file.
|
*/

Route::get('/health', fn() => response()->json(['ok' => true]));
Route::post('/login', [LoginController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [MeController::class, 'show']);
});
