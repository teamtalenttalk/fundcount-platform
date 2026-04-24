<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\ComplianceController;
use App\Http\Controllers\Api\IntegrationController;
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

    // AI Intelligence (Phase 2)
    Route::prefix('ai')->group(function () {
        Route::post('/portfolio-analysis', [AiController::class, 'portfolioAnalysis']);
        Route::post('/query', [AiController::class, 'query']);
        Route::post('/predictions', [AiController::class, 'predictions']);
        Route::post('/reconciliation', [AiController::class, 'reconciliation']);
        Route::post('/document-process', [AiController::class, 'documentProcess']);
        Route::post('/nav-calculate', [AiController::class, 'navCalculate']);
        Route::get('/dashboard', [AiController::class, 'dashboard']);
    });

    // Compliance & Reporting (Phase 3)
    Route::prefix('compliance')->group(function () {
        Route::get('/dashboard', [ComplianceController::class, 'dashboard']);
        Route::post('/regulatory-check', [ComplianceController::class, 'regulatoryCheck']);
        Route::get('/filings', [ComplianceController::class, 'filings']);
        Route::post('/generate-report', [ComplianceController::class, 'generateReport']);
        Route::get('/tax-lots/{portfolio_id}', [ComplianceController::class, 'taxLots']);
        Route::get('/gips/{portfolio_id}', [ComplianceController::class, 'gips']);
        Route::get('/audit-trail', [ComplianceController::class, 'auditTrail']);
        Route::get('/gaap-report/{portfolio_id}', [ComplianceController::class, 'gaapReport']);
    });

    // Integration & Scale (Phase 4)
    Route::prefix('integration')->group(function () {
        Route::get('/market-data', [IntegrationController::class, 'marketData']);
        Route::get('/custodian', [IntegrationController::class, 'custodian']);
        Route::get('/oms', [IntegrationController::class, 'oms']);
        Route::post('/oms/order', [IntegrationController::class, 'omsCreateOrder']);
        Route::get('/investor-portal', [IntegrationController::class, 'investorPortal']);
        Route::get('/multi-fund', [IntegrationController::class, 'multiFund']);
        Route::get('/api-gateway', [IntegrationController::class, 'apiGateway']);
    });
});
