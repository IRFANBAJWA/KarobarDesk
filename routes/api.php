<?php

use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\LogoutController;
use App\Http\Controllers\Api\FieldPermissionController;
use App\Http\Controllers\Api\CompanySwitchController;
use App\Http\Controllers\Api\Auth\MeController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SyncController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\PriceListController;
use App\Http\Controllers\Api\ItemPriceController;
use App\Http\Controllers\Api\CustomerController;

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
    // Auth
    Route::get('/me', [MeController::class, 'show']);
    Route::post('/logout', [LogoutController::class, 'logout']);
    Route::get('/field-permissions/{form}', [FieldPermissionController::class, 'show']);
    Route::post('/company/switch', [CompanySwitchController::class, 'switch'])
        ->middleware('company.access');

    // Items
    Route::get('/items', [ItemController::class, 'index']);
    Route::get('/items/admin',   [ItemController::class, 'listAll']);
    Route::get('/items/picker', [ItemController::class, 'pickerAll']);
    Route::get('/items/{item}',  [ItemController::class, 'show']);
    Route::patch('/items/{item}', [ItemController::class, 'update']);

    // Price Lists
    Route::get('/price-lists', [PriceListController::class, 'index']);
    Route::get('/price-lists/admin', [PriceListController::class, 'listAll']);   // MUST be before {priceList}
    Route::get('/price-lists/{priceList}', [PriceListController::class, 'show']);

    // Item Prices
    Route::get('/item-prices', [ItemPriceController::class, 'index']);             // picker
    Route::get('/item-prices/admin', [ItemPriceController::class, 'listAll']);     // MUST be before {itemPrice}
    Route::post('/item-prices', [ItemPriceController::class, 'store']);
    Route::get('/item-prices/{itemPrice}', [ItemPriceController::class, 'show']);
    Route::patch('/item-prices/{itemPrice}', [ItemPriceController::class, 'update']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/admin', [CustomerController::class, 'listAll']);      // MUST be before {customer}
    Route::get('/customers/{customer}', [CustomerController::class, 'show']);
    Route::patch('/customers/{customer}', [CustomerController::class, 'update']);
});

Route::middleware(['auth:sanctum', 'super.admin'])->group(function () {
    // Sync module
    Route::get('/sync/status',   [SyncController::class, 'status']);
    Route::get('/sync/activity', [SyncController::class, 'activity']);
    Route::post('/sync/login',   [SyncController::class, 'login']);   // BEFORE {step}
    Route::post('/sync/{step}',  [SyncController::class, 'run']);     // AFTER login

    // Pickers for Users Module
    Route::get('/roles',     [RoleController::class,    'index']);
    Route::get('/companies', [CompanyController::class, 'index']);

    // Companies module — admin list + show + toggle
    Route::get('/companies/admin', [CompanyController::class, 'listAll']);
    Route::get('/companies/{company}', [CompanyController::class, 'show']);
    Route::patch('/companies/{company}/toggle-active', [CompanyController::class, 'toggleActive']);

    // Users Module — CRUD
    Route::get('/users',                   [UserController::class, 'index']);
    Route::post('/users',                   [UserController::class, 'store']);
    Route::get('/users/{user}',            [UserController::class, 'show']);
    Route::put('/users/{user}',            [UserController::class, 'update']);
    Route::post('/users/{user}/deactivate', [UserController::class, 'deactivate']);
    Route::post('/users/{user}/activate',   [UserController::class, 'activate']);
    Route::post('/users/{user}/erpnext/link',   [UserController::class, 'linkErpNext']);
    Route::delete('/users/{user}/erpnext/unlink', [UserController::class, 'unlinkErpNext']);
});
