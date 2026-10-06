<?php

use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\LogoutController;
use App\Http\Controllers\Api\FieldPermissionController;
use App\Http\Controllers\Api\CompanySwitchController;
use App\Http\Controllers\Api\Auth\MeController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SyncController;

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
    Route::post('/logout', [LogoutController::class, 'logout']);
    Route::get('/field-permissions/{form}', [FieldPermissionController::class, 'show']);
    Route::post('/company/switch', [CompanySwitchController::class, 'switch'])
        ->middleware('company.access');
});

Route::middleware(['auth:sanctum', 'super.admin'])->group(function () {
    Route::get('/sync/status',   [SyncController::class, 'status']);
    Route::get('/sync/activity', [SyncController::class, 'activity']);
    Route::post('/sync/test',    [SyncController::class, 'test']);
    Route::post('/sync/{step}',  [SyncController::class, 'run']);
});
