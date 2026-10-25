<?php

use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\LogoutController;
use App\Http\Controllers\Api\Auth\MeController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\CompanySwitchController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\FieldPermissionController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\ItemPriceController;
use App\Http\Controllers\Api\Pos\PosAuthController;
use App\Http\Controllers\Api\Pos\PosRejectedSalesController;
use App\Http\Controllers\Api\Pos\PosReturnsController;
use App\Http\Controllers\Api\Pos\PosSalesController;
use App\Http\Controllers\Api\Pos\PosSyncController;
use App\Http\Controllers\Api\PriceListController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\SyncController;
use App\Http\Controllers\Api\TillAccountController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SalesController; // Add this

Route::get('/health', fn() => response()->json(['ok' => true]));
Route::post('/login', [LoginController::class, 'login']);

// ─────────────────────────────────────────────────────────────
// POS MIDDLEWARE — IBPOS bearer-token auth
// ─────────────────────────────────────────────────────────────
Route::prefix('pos')->group(function () {
    Route::post('/login', [PosAuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout',            [PosAuthController::class, 'logout']);
        Route::post('/sales',             [PosSalesController::class, 'store']);
        Route::post('/sales/sync',        [PosSalesController::class, 'sync']);
        Route::post('/returns',           [PosReturnsController::class, 'store']);
        Route::put('/rejected-sales/{id}', [PosRejectedSalesController::class, 'update']);
        Route::post('/sync/items',  [PosSyncController::class, 'items']);
        Route::post('/sync/stocks', [PosSyncController::class, 'stocks']);
        // REMOVED the SalesController routes from here
    });
});

// ─────────────────────────────────────────────────────────────
// AUTHENTICATED — SPA session cookie (any role)
// ─────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/me', [MeController::class, 'show']);
    Route::post('/logout', [LogoutController::class, 'logout']);
    Route::get('/field-permissions/{form}', [FieldPermissionController::class, 'show']);
    Route::post('/company/switch', [CompanySwitchController::class, 'switch'])
        ->middleware('company.access');

    // ⭐ ADDED THE SALES UI ROUTES HERE ⭐
    Route::get('/sales', [SalesController::class, 'index']);
    Route::get('/sales/{id}', [SalesController::class, 'show']);

    // Items — reads for all authenticated users
    Route::get('/items', [ItemController::class, 'index']);
    Route::get('/items/picker', [ItemController::class, 'pickerAll']);
    Route::get('/items/{item}', [ItemController::class, 'show']);

    // ... (the rest of your SPA routes remain the same) ...

    // Stock
    Route::prefix('stock')->group(function () {
        Route::get('/companies', [StockController::class, 'companies']);
        Route::get('/balances',  [StockController::class, 'balances']);
        Route::get('/ledger/{item}', [StockController::class, 'ledger']);
    });

    // Till Accounts
    Route::prefix('till-accounts')->group(function () {
        Route::get('/tills', [TillAccountController::class, 'tills']);
        Route::post('/', [TillAccountController::class, 'store']);
        Route::get('/{user}', [TillAccountController::class, 'show']);
        Route::post('/{user}', [TillAccountController::class, 'update']);
    });
});

// ─────────────────────────────────────────────────────────────
// SUPER ADMIN ONLY
// ─────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'super.admin'])->group(function () {
    // ... (the rest of your Super Admin routes remain the same) ...
    // Sync module
    Route::get('/sync/status',   [SyncController::class, 'status']);
    Route::get('/sync/activity', [SyncController::class, 'activity']);
    Route::post('/sync/login',   [SyncController::class, 'login']);
    Route::post('/sync/{step}',  [SyncController::class, 'run']);

    // Pickers
    Route::get('/roles',     [RoleController::class, 'index']);
    Route::get('/companies', [CompanyController::class, 'index']);

    // Companies — admin list + show + toggle
    Route::get('/companies/admin',                      [CompanyController::class, 'listAll']);
    Route::get('/companies/{company}',                  [CompanyController::class, 'show']);
    Route::patch('/companies/{company}/toggle-active',  [CompanyController::class, 'toggleActive']);

    // Users — CRUD + ERPNext link/unlink + till edit
    Route::get('/users',                           [UserController::class, 'index']);
    Route::post('/users',                          [UserController::class, 'store']);
    Route::get('/users/{user}',                    [UserController::class, 'show']);
    Route::put('/users/{user}',                    [UserController::class, 'update']);
    Route::post('/users/{user}/deactivate',        [UserController::class, 'deactivate']);
    Route::post('/users/{user}/activate',          [UserController::class, 'activate']);
    Route::post('/users/{user}/erpnext/link',      [UserController::class, 'linkErpNext']);
    Route::delete('/users/{user}/erpnext/unlink',  [UserController::class, 'unlinkErpNext']);
    Route::patch('/users/{user}/till',             [UserController::class, 'updateTill']);

    // Items — admin-only endpoints
    Route::get('/items/admin',      [ItemController::class, 'listAll']);
    Route::get('/items/unpriced',   [ItemController::class, 'unpricedItems']);
    Route::patch('/items/{item}',   [ItemController::class, 'update']);

    // Price Lists — admin
    Route::get('/price-lists/admin', [PriceListController::class, 'listAll']);

    // Item Prices — admin writes
    Route::get('/item-prices/admin',             [ItemPriceController::class, 'listAll']);
    Route::post('/item-prices',                  [ItemPriceController::class, 'store']);
    Route::patch('/item-prices/{itemPrice}',     [ItemPriceController::class, 'update']);

    // Customers — admin list
    Route::get('/customers/admin', [CustomerController::class, 'listAll']);
});
