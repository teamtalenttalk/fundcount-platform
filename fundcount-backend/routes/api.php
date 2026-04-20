<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CapitalAccountController;
use App\Http\Controllers\Api\CurrencyController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DataImportController;
use App\Http\Controllers\Api\DataSourceController;
use App\Http\Controllers\Api\FiscalPeriodController;
use App\Http\Controllers\Api\InvestorController;
use App\Http\Controllers\Api\JournalEntryController;
use App\Http\Controllers\Api\PartnerAllocationController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\PerformanceController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\PositionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\TradeController;
use App\Http\Controllers\Api\TrialBalanceController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Accounts (Chart of Accounts)
    Route::apiResource('accounts', AccountController::class);

    // Journal Entries
    Route::apiResource('journal-entries', JournalEntryController::class)->only(['index', 'store', 'show', 'update']);

    // Portfolios
    Route::apiResource('portfolios', PortfolioController::class)->only(['index', 'store', 'show']);

    // Assets
    Route::apiResource('assets', AssetController::class)->only(['index', 'store']);

    // Positions
    Route::get('/positions', [PositionController::class, 'index']);

    // Trades
    Route::apiResource('trades', TradeController::class)->only(['index', 'store']);

    // Partners
    Route::apiResource('partners', PartnerController::class)->only(['index', 'store']);

    // Capital Accounts
    Route::get('/capital-accounts', [CapitalAccountController::class, 'index']);

    // Partner Allocations
    Route::get('/partner-allocations', [PartnerAllocationController::class, 'index']);

    // Performance
    Route::get('/performance', [PerformanceController::class, 'index']);

    // Investors
    Route::get('/investors', [InvestorController::class, 'index']);

    // Data Sources
    Route::apiResource('data-sources', DataSourceController::class)->only(['index', 'store']);

    // Data Imports
    Route::get('/data-imports', [DataImportController::class, 'index']);

    // Reports
    Route::apiResource('reports', ReportController::class)->only(['index', 'store']);

    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);

    // Users
    Route::apiResource('users', UserController::class)->only(['index', 'store']);

    // Currencies
    Route::get('/currencies', [CurrencyController::class, 'index']);

    // Fiscal Periods
    Route::get('/fiscal-periods', [FiscalPeriodController::class, 'index']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Trial Balance
    Route::get('/trial-balance', [TrialBalanceController::class, 'index']);
});
