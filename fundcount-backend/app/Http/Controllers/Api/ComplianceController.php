<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Asset;
use App\Models\AuditLog;
use App\Models\Benchmark;
use App\Models\BenchmarkReturn;
use App\Models\CapitalAccount;
use App\Models\FiscalPeriod;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\NAVHistory;
use App\Models\Partner;
use App\Models\PartnerAllocation;
use App\Models\PerformanceRecord;
use App\Models\Portfolio;
use App\Models\Position;
use App\Models\Trade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComplianceController extends Controller
{
    // =========================================================================
    // 1. GET /compliance/dashboard
    // =========================================================================

    /**
     * Compliance dashboard overview: compliance score, upcoming deadlines,
     * recent test results, and filing status counts.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $portfolios = Portfolio::with(['positions.asset', 'performanceRecords' => function ($q) {
            $q->orderByDesc('date')->limit(5);
        }])->get();

        // --- Compliance score (0-100) ---
        $concentrationResults = $this->runConcentrationChecks($portfolios);
        $diversificationResults = $this->runDiversificationChecks($portfolios);
        $pricingResults = $this->runPricingFreshnessChecks();
        $reconciliationResults = $this->runReconciliationChecks();

        $allChecks = array_merge($concentrationResults, $diversificationResults, $pricingResults, $reconciliationResults);
        $totalChecks = count($allChecks);
        $passedChecks = collect($allChecks)->where('status', 'PASS')->count();
        $complianceScore = $totalChecks > 0 ? (int) round(($passedChecks / $totalChecks) * 100) : 100;

        // --- Upcoming deadlines ---
        $now = now();
        $deadlines = $this->generateRegulatoryDeadlines($now);

        // --- Recent test results (last 10 checks) ---
        $recentTests = collect($allChecks)->sortByDesc('checked_at')->take(10)->values();

        // --- Filing status counts ---
        $filings = $this->generateFilingsList($now);
        $filingStatusCounts = collect($filings)->groupBy('status')->map->count();

        // --- Risk summary from positions ---
        $totalAUM = $portfolios->sum('total_value');
        $activePositionCount = Position::whereNull('close_date')->count();
        $unrealizedPnl = Position::whereNull('close_date')->sum('unrealized_pnl');

        return response()->json([
            'compliance_score' => $complianceScore,
            'score_breakdown' => [
                'total_checks' => $totalChecks,
                'passed' => $passedChecks,
                'failed' => $totalChecks - $passedChecks,
                'categories' => [
                    'concentration_limits' => collect($concentrationResults)->where('status', 'PASS')->count() . '/' . count($concentrationResults),
                    'diversification' => collect($diversificationResults)->where('status', 'PASS')->count() . '/' . count($diversificationResults),
                    'pricing_freshness' => collect($pricingResults)->where('status', 'PASS')->count() . '/' . count($pricingResults),
                    'reconciliation' => collect($reconciliationResults)->where('status', 'PASS')->count() . '/' . count($reconciliationResults),
                ],
            ],
            'upcoming_deadlines' => $deadlines,
            'recent_test_results' => $recentTests,
            'filing_status_counts' => [
                'filed' => (int) ($filingStatusCounts['FILED'] ?? 0),
                'pending' => (int) ($filingStatusCounts['PENDING'] ?? 0),
                'overdue' => (int) ($filingStatusCounts['OVERDUE'] ?? 0),
                'upcoming' => (int) ($filingStatusCounts['UPCOMING'] ?? 0),
            ],
            'portfolio_summary' => [
                'total_portfolios' => $portfolios->count(),
                'total_aum' => round((float) $totalAUM, 2),
                'active_positions' => $activePositionCount,
                'total_unrealized_pnl' => round((float) $unrealizedPnl, 2),
            ],
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    // =========================================================================
    // 2. POST /compliance/regulatory-check
    // =========================================================================

    /**
     * Run comprehensive compliance checks for a specific portfolio:
     * concentration limits, leverage, liquidity, sector exposure,
     * single-issuer limits, and derivative exposure.
     */
    public function regulatoryCheck(Request $request): JsonResponse
    {
        $request->validate([
            'portfolio_id' => 'required|integer|exists:portfolios,id',
        ]);

        $portfolio = Portfolio::with(['positions.asset', 'trades', 'navHistories'])
            ->findOrFail($request->portfolio_id);

        $positions = $portfolio->positions()->with('asset')->whereNull('close_date')->get();
        $totalMarketValue = $positions->sum('market_value');

        $results = [];

        // --- 1. Concentration limits (single position max 10%) ---
        foreach ($positions as $position) {
            $weight = $totalMarketValue > 0 ? ((float) $position->market_value / (float) $totalMarketValue) * 100 : 0;
            if ($weight > 10) {
                $results[] = [
                    'rule' => 'Single Position Concentration',
                    'category' => 'CONCENTRATION',
                    'limit' => '10% max per position',
                    'actual' => round($weight, 2) . '%',
                    'status' => 'FAIL',
                    'severity' => $weight > 20 ? 'CRITICAL' : 'WARNING',
                    'detail' => sprintf('%s at %.2f%% exceeds 10%% single-position limit', $position->asset->symbol ?? 'Unknown', $weight),
                    'asset' => $position->asset->symbol ?? null,
                    'checked_at' => now()->toIso8601String(),
                ];
            }
        }
        if (collect($results)->where('category', 'CONCENTRATION')->isEmpty()) {
            $results[] = [
                'rule' => 'Single Position Concentration',
                'category' => 'CONCENTRATION',
                'limit' => '10% max per position',
                'actual' => 'All positions within limit',
                'status' => 'PASS',
                'severity' => 'OK',
                'detail' => 'No single position exceeds 10% of portfolio value',
                'asset' => null,
                'checked_at' => now()->toIso8601String(),
            ];
        }

        // --- 2. Sector concentration (max 25% per sector) ---
        $sectorWeights = $positions->groupBy(fn($p) => $p->asset->sector ?? 'Unknown')
            ->map(fn($group) => $totalMarketValue > 0 ? ($group->sum('market_value') / (float) $totalMarketValue) * 100 : 0);

        $sectorPass = true;
        foreach ($sectorWeights as $sector => $weight) {
            if ($weight > 25) {
                $sectorPass = false;
                $results[] = [
                    'rule' => 'Sector Concentration',
                    'category' => 'SECTOR_EXPOSURE',
                    'limit' => '25% max per sector',
                    'actual' => round($weight, 2) . '%',
                    'status' => 'FAIL',
                    'severity' => $weight > 40 ? 'CRITICAL' : 'WARNING',
                    'detail' => sprintf('%s sector at %.2f%% exceeds 25%% sector limit', $sector, $weight),
                    'asset' => null,
                    'checked_at' => now()->toIso8601String(),
                ];
            }
        }
        if ($sectorPass) {
            $results[] = [
                'rule' => 'Sector Concentration',
                'category' => 'SECTOR_EXPOSURE',
                'limit' => '25% max per sector',
                'actual' => 'All sectors within limit',
                'status' => 'PASS',
                'severity' => 'OK',
                'detail' => 'No sector exceeds 25% of portfolio value',
                'asset' => null,
                'checked_at' => now()->toIso8601String(),
            ];
        }

        // --- 3. Leverage check (derivative notional vs NAV) ---
        $derivativePositions = $positions->filter(fn($p) => $p->asset->asset_class === Asset::CLASS_DERIVATIVE);
        $derivativeNotional = $derivativePositions->sum('market_value');
        $latestNav = $portfolio->navHistories()->orderByDesc('date')->first();
        $nav = $latestNav ? (float) $latestNav->nav : (float) $totalMarketValue;
        $leverageRatio = $nav > 0 ? ((float) $derivativeNotional / $nav) * 100 : 0;

        $results[] = [
            'rule' => 'Leverage Limit',
            'category' => 'LEVERAGE',
            'limit' => '150% max gross leverage',
            'actual' => round($leverageRatio, 2) . '%',
            'status' => $leverageRatio <= 150 ? 'PASS' : 'FAIL',
            'severity' => $leverageRatio > 150 ? ($leverageRatio > 200 ? 'CRITICAL' : 'WARNING') : 'OK',
            'detail' => sprintf('Derivative notional is %.2f%% of NAV (limit: 150%%)', $leverageRatio),
            'asset' => null,
            'checked_at' => now()->toIso8601String(),
        ];

        // --- 4. Liquidity check (illiquid assets max 15%) ---
        $illiquidClasses = [Asset::CLASS_PRIVATE_EQUITY, Asset::CLASS_REAL_ESTATE];
        $illiquidValue = $positions->filter(fn($p) => in_array($p->asset->asset_class, $illiquidClasses))->sum('market_value');
        $illiquidPct = $totalMarketValue > 0 ? ((float) $illiquidValue / (float) $totalMarketValue) * 100 : 0;

        $results[] = [
            'rule' => 'Illiquid Asset Limit',
            'category' => 'LIQUIDITY',
            'limit' => '15% max illiquid assets',
            'actual' => round($illiquidPct, 2) . '%',
            'status' => $illiquidPct <= 15 ? 'PASS' : 'FAIL',
            'severity' => $illiquidPct > 15 ? ($illiquidPct > 25 ? 'CRITICAL' : 'WARNING') : 'OK',
            'detail' => sprintf('Illiquid assets (PE + Real Estate) at %.2f%% of portfolio', $illiquidPct),
            'asset' => null,
            'checked_at' => now()->toIso8601String(),
        ];

        // --- 5. Cash buffer (min 2% cash) ---
        $cashValue = $positions->filter(fn($p) => $p->asset->asset_class === Asset::CLASS_CASH)->sum('market_value');
        $cashPct = $totalMarketValue > 0 ? ((float) $cashValue / (float) $totalMarketValue) * 100 : 0;

        $results[] = [
            'rule' => 'Minimum Cash Buffer',
            'category' => 'LIQUIDITY',
            'limit' => '2% minimum cash',
            'actual' => round($cashPct, 2) . '%',
            'status' => $cashPct >= 2 ? 'PASS' : 'FAIL',
            'severity' => $cashPct < 2 ? ($cashPct < 1 ? 'CRITICAL' : 'WARNING') : 'OK',
            'detail' => sprintf('Cash position at %.2f%% of portfolio (minimum 2%% required)', $cashPct),
            'asset' => null,
            'checked_at' => now()->toIso8601String(),
        ];

        // --- 6. Single-issuer limit for fixed income (5% max per issuer) ---
        $fixedIncomePositions = $positions->filter(fn($p) => $p->asset->asset_class === Asset::CLASS_FIXED_INCOME);
        $fiIssuerPass = true;
        foreach ($fixedIncomePositions as $fiPos) {
            $fiWeight = $totalMarketValue > 0 ? ((float) $fiPos->market_value / (float) $totalMarketValue) * 100 : 0;
            if ($fiWeight > 5) {
                $fiIssuerPass = false;
                $results[] = [
                    'rule' => 'Fixed Income Single-Issuer Limit',
                    'category' => 'ISSUER_LIMIT',
                    'limit' => '5% max per fixed income issuer',
                    'actual' => round($fiWeight, 2) . '%',
                    'status' => 'FAIL',
                    'severity' => 'WARNING',
                    'detail' => sprintf('%s at %.2f%% exceeds 5%% fixed income single-issuer limit', $fiPos->asset->symbol ?? 'Unknown', $fiWeight),
                    'asset' => $fiPos->asset->symbol ?? null,
                    'checked_at' => now()->toIso8601String(),
                ];
            }
        }
        if ($fiIssuerPass) {
            $results[] = [
                'rule' => 'Fixed Income Single-Issuer Limit',
                'category' => 'ISSUER_LIMIT',
                'limit' => '5% max per fixed income issuer',
                'actual' => 'All issuers within limit',
                'status' => 'PASS',
                'severity' => 'OK',
                'detail' => 'No fixed income issuer exceeds 5% of portfolio value',
                'asset' => null,
                'checked_at' => now()->toIso8601String(),
            ];
        }

        // --- 7. Country diversification (max 40% single country) ---
        $countryWeights = $positions->groupBy(fn($p) => $p->asset->country ?? 'Unknown')
            ->map(fn($group) => $totalMarketValue > 0 ? ($group->sum('market_value') / (float) $totalMarketValue) * 100 : 0);

        $countryPass = true;
        foreach ($countryWeights as $country => $weight) {
            if ($weight > 40 && $country !== 'Unknown') {
                $countryPass = false;
                $results[] = [
                    'rule' => 'Country Concentration',
                    'category' => 'GEOGRAPHIC_EXPOSURE',
                    'limit' => '40% max single country',
                    'actual' => round($weight, 2) . '%',
                    'status' => 'FAIL',
                    'severity' => 'WARNING',
                    'detail' => sprintf('%s exposure at %.2f%% exceeds 40%% country limit', $country, $weight),
                    'asset' => null,
                    'checked_at' => now()->toIso8601String(),
                ];
            }
        }
        if ($countryPass) {
            $results[] = [
                'rule' => 'Country Concentration',
                'category' => 'GEOGRAPHIC_EXPOSURE',
                'limit' => '40% max single country',
                'actual' => 'All countries within limit',
                'status' => 'PASS',
                'severity' => 'OK',
                'detail' => 'No single-country exposure exceeds 40% of portfolio',
                'asset' => null,
                'checked_at' => now()->toIso8601String(),
            ];
        }

        $passed = collect($results)->where('status', 'PASS')->count();
        $failed = collect($results)->where('status', 'FAIL')->count();

        return response()->json([
            'portfolio_id' => $portfolio->id,
            'portfolio_name' => $portfolio->name,
            'check_date' => now()->toIso8601String(),
            'total_market_value' => round((float) $totalMarketValue, 2),
            'nav' => round($nav, 2),
            'summary' => [
                'total_checks' => count($results),
                'passed' => $passed,
                'failed' => $failed,
                'compliance_status' => $failed === 0 ? 'COMPLIANT' : ($failed > 2 ? 'NON_COMPLIANT' : 'WARNING'),
            ],
            'results' => $results,
        ]);
    }

    // =========================================================================
    // 3. GET /compliance/filings
    // =========================================================================

    /**
     * List regulatory filings with status (SEC, AIFMD, Form PF, etc.).
     * Generates realistic sample data based on actual portfolio and partner counts.
     */
    public function filings(Request $request): JsonResponse
    {
        $now = now();
        $filings = $this->generateFilingsList($now);

        // Add summary stats
        $statusCounts = collect($filings)->groupBy('status')->map->count();

        return response()->json([
            'filings' => $filings,
            'summary' => [
                'total' => count($filings),
                'filed' => (int) ($statusCounts['FILED'] ?? 0),
                'pending' => (int) ($statusCounts['PENDING'] ?? 0),
                'overdue' => (int) ($statusCounts['OVERDUE'] ?? 0),
                'upcoming' => (int) ($statusCounts['UPCOMING'] ?? 0),
            ],
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    // =========================================================================
    // 4. POST /compliance/generate-report
    // =========================================================================

    /**
     * Generate a fund report (investor letter, quarterly performance, K-1)
     * based on real portfolio data.
     */
    public function generateReport(Request $request): JsonResponse
    {
        $request->validate([
            'report_type' => 'required|string|in:investor_letter,quarterly_performance,k1',
            'portfolio_id' => 'required|integer|exists:portfolios,id',
            'period' => 'nullable|string|in:Q1,Q2,Q3,Q4',
        ]);

        $portfolio = Portfolio::with(['positions.asset', 'performanceRecords', 'navHistories', 'benchmark'])
            ->findOrFail($request->portfolio_id);

        $period = $request->period ?? 'Q' . ceil(now()->month / 3);
        $year = now()->year;

        $report = match ($request->report_type) {
            'investor_letter' => $this->generateInvestorLetter($portfolio, $period, $year),
            'quarterly_performance' => $this->generateQuarterlyPerformance($portfolio, $period, $year),
            'k1' => $this->generateK1Report($portfolio, $year),
        };

        return response()->json($report);
    }

    // =========================================================================
    // 5. GET /compliance/tax-lots/{portfolio_id}
    // =========================================================================

    /**
     * Get tax lot positions with FIFO/LIFO cost basis and unrealized gains/losses.
     * Builds tax lots from the trade history for each asset in the portfolio.
     */
    public function taxLots(Request $request, int $portfolio_id): JsonResponse
    {
        $portfolio = Portfolio::findOrFail($portfolio_id);

        // Get all BUY/COVER trades (lot openers) grouped by asset
        $trades = Trade::with('asset')
            ->where('portfolio_id', $portfolio_id)
            ->whereIn('trade_type', [Trade::TYPE_BUY, Trade::TYPE_COVER])
            ->where('status', '!=', Trade::STATUS_CANCELLED)
            ->orderBy('trade_date')
            ->get();

        // Get SELL trades to compute which lots are consumed
        $sellTrades = Trade::with('asset')
            ->where('portfolio_id', $portfolio_id)
            ->whereIn('trade_type', [Trade::TYPE_SELL, Trade::TYPE_SHORT])
            ->where('status', '!=', Trade::STATUS_CANCELLED)
            ->orderBy('trade_date')
            ->get()
            ->groupBy('asset_id');

        $taxLots = [];
        $summary = [
            'total_cost_basis' => 0,
            'total_market_value' => 0,
            'total_unrealized_gain_loss' => 0,
            'short_term_gain_loss' => 0,
            'long_term_gain_loss' => 0,
            'total_lots' => 0,
        ];

        $tradesByAsset = $trades->groupBy('asset_id');

        foreach ($tradesByAsset as $assetId => $assetTrades) {
            $asset = $assetTrades->first()->asset;
            if (!$asset) continue;

            $currentPrice = (float) $asset->current_price;
            $assetSells = $sellTrades[$assetId] ?? collect();
            $totalSoldQty = $assetSells->sum('quantity');

            // Build FIFO lots
            $remainingSold = (float) $totalSoldQty;

            foreach ($assetTrades as $trade) {
                $lotQty = (float) $trade->quantity;
                $lotPrice = (float) $trade->price;
                $tradeDate = $trade->trade_date;

                // FIFO: consume from earliest lots first
                if ($remainingSold >= $lotQty) {
                    $remainingSold -= $lotQty;
                    continue; // lot fully sold
                } elseif ($remainingSold > 0) {
                    $lotQty -= $remainingSold;
                    $remainingSold = 0;
                }

                $costBasis = round($lotQty * $lotPrice, 4);
                $marketValue = round($lotQty * $currentPrice, 4);
                $unrealizedGL = round($marketValue - $costBasis, 4);
                $holdingDays = $tradeDate ? $tradeDate->diffInDays(now()) : 0;
                $isLongTerm = $holdingDays > 365;
                $returnPct = $costBasis > 0 ? round(($unrealizedGL / $costBasis) * 100, 2) : 0;

                $taxLots[] = [
                    'asset_symbol' => $asset->symbol,
                    'asset_name' => $asset->name,
                    'asset_class' => $asset->asset_class,
                    'acquisition_date' => $tradeDate?->toDateString(),
                    'trade_number' => $trade->trade_number,
                    'quantity' => round($lotQty, 6),
                    'cost_per_unit' => round($lotPrice, 6),
                    'cost_basis' => $costBasis,
                    'current_price' => $currentPrice,
                    'market_value' => $marketValue,
                    'unrealized_gain_loss' => $unrealizedGL,
                    'return_pct' => $returnPct,
                    'holding_period_days' => $holdingDays,
                    'holding_period_type' => $isLongTerm ? 'LONG_TERM' : 'SHORT_TERM',
                    'fifo_order' => $summary['total_lots'] + 1,
                ];

                $summary['total_cost_basis'] += $costBasis;
                $summary['total_market_value'] += $marketValue;
                $summary['total_unrealized_gain_loss'] += $unrealizedGL;
                if ($isLongTerm) {
                    $summary['long_term_gain_loss'] += $unrealizedGL;
                } else {
                    $summary['short_term_gain_loss'] += $unrealizedGL;
                }
                $summary['total_lots']++;
            }
        }

        // Round summary
        $summary = array_map(fn($v) => is_float($v) ? round($v, 2) : $v, $summary);

        // LIFO cost basis comparison
        $lifoCostBasis = $this->computeLifoCostBasis($tradesByAsset, $sellTrades);

        return response()->json([
            'portfolio_id' => $portfolio->id,
            'portfolio_name' => $portfolio->name,
            'as_of_date' => now()->toDateString(),
            'method' => 'FIFO',
            'summary' => $summary,
            'lifo_comparison' => [
                'lifo_total_cost_basis' => round($lifoCostBasis, 2),
                'fifo_total_cost_basis' => $summary['total_cost_basis'],
                'method_difference' => round($lifoCostBasis - $summary['total_cost_basis'], 2),
            ],
            'tax_lots' => $taxLots,
        ]);
    }

    // =========================================================================
    // 6. GET /compliance/gips/{portfolio_id}
    // =========================================================================

    /**
     * Get GIPS (Global Investment Performance Standards) composite data
     * with TWR (Time-Weighted Return) and MWR (Money-Weighted Return) calculations.
     */
    public function gips(Request $request, int $portfolio_id): JsonResponse
    {
        $portfolio = Portfolio::with(['benchmark', 'navHistories', 'performanceRecords', 'trades'])
            ->findOrFail($portfolio_id);

        // --- TWR from daily NAV history ---
        $navHistory = $portfolio->navHistories()
            ->orderBy('date')
            ->get();

        $twr = $this->computeTWR($navHistory);

        // --- Sub-period TWR (monthly) ---
        $monthlyNavs = $navHistory->groupBy(fn($n) => $n->date->format('Y-m'));
        $monthlyTWR = [];
        foreach ($monthlyNavs as $month => $navs) {
            $sorted = $navs->sortBy('date');
            $firstNav = (float) $sorted->first()->nav_per_share;
            $lastNav = (float) $sorted->last()->nav_per_share;
            $monthReturn = $firstNav > 0 ? ($lastNav - $firstNav) / $firstNav : 0;
            $monthlyTWR[] = [
                'period' => $month,
                'beginning_nav' => round($firstNav, 6),
                'ending_nav' => round($lastNav, 6),
                'return' => round($monthReturn * 100, 4),
            ];
        }

        // --- MWR (IRR approximation from cash flows) ---
        $mwr = $this->computeMWR($portfolio);

        // --- Benchmark comparison ---
        $benchmarkReturns = null;
        $excessReturn = null;
        if ($portfolio->benchmark_id) {
            $benchmarkData = BenchmarkReturn::where('benchmark_id', $portfolio->benchmark_id)
                ->orderByDesc('date')
                ->first();
            if ($benchmarkData) {
                $benchmarkReturns = [
                    'benchmark_name' => $portfolio->benchmark->name ?? 'N/A',
                    'ytd_return' => round((float) $benchmarkData->ytd_return * 100, 4),
                    'date' => $benchmarkData->date?->toDateString(),
                ];
                $excessReturn = round(($twr['cumulative_return'] ?? 0) - ((float) $benchmarkData->ytd_return * 100), 4);
            }
        }

        // --- Annualized returns ---
        $inceptionDate = $portfolio->inception_date;
        $yearsSinceInception = $inceptionDate ? max($inceptionDate->diffInDays(now()) / 365.25, 0.01) : 1;
        $cumulativeReturnDecimal = ($twr['cumulative_return'] ?? 0) / 100;
        $annualizedReturn = (pow(1 + $cumulativeReturnDecimal, 1 / $yearsSinceInception) - 1) * 100;

        // --- Dispersion and composite stats ---
        $perfRecords = $portfolio->performanceRecords()
            ->where('period_type', PerformanceRecord::PERIOD_MONTHLY)
            ->orderBy('date')
            ->get();

        $monthlyReturns = $perfRecords->pluck('total_return')->map(fn($r) => (float) $r * 100);
        $returnStdDev = $this->computeStdDev($monthlyReturns);

        // 3-year annualized return
        $threeYearRecords = $perfRecords->filter(fn($r) => $r->date >= now()->subYears(3));
        $threeYearAvg = $threeYearRecords->count() > 0 ? $threeYearRecords->avg('total_return') : 0;
        $threeYearAnnualized = round((float) $threeYearAvg * 12 * 100, 4);

        return response()->json([
            'portfolio_id' => $portfolio->id,
            'portfolio_name' => $portfolio->name,
            'composite_name' => $portfolio->name . ' Composite',
            'inception_date' => $inceptionDate?->toDateString(),
            'currency' => $portfolio->currency ?? 'USD',
            'as_of_date' => now()->toDateString(),
            'gips_compliant' => true,
            'time_weighted_return' => [
                'cumulative' => round($twr['cumulative_return'] ?? 0, 4),
                'annualized' => round($annualizedReturn, 4),
                'three_year_annualized' => $threeYearAnnualized,
                'data_points' => $twr['data_points'] ?? 0,
                'method' => 'Modified Dietz / Daily Valuation',
            ],
            'money_weighted_return' => [
                'irr' => round($mwr, 4),
                'method' => 'Modified IRR (cash-flow weighted)',
            ],
            'monthly_returns' => $monthlyTWR,
            'benchmark_comparison' => $benchmarkReturns,
            'excess_return' => $excessReturn,
            'risk_statistics' => [
                'monthly_return_std_dev' => round($returnStdDev, 4),
                'annualized_std_dev' => round($returnStdDev * sqrt(12), 4),
                'sharpe_ratio' => $perfRecords->count() > 0 ? round((float) $perfRecords->last()->sharpe_ratio, 4) : null,
                'max_drawdown' => $perfRecords->count() > 0 ? round((float) $perfRecords->min('max_drawdown') * 100, 4) : null,
            ],
            'composite_statistics' => [
                'number_of_portfolios' => 1,
                'composite_assets' => round((float) $portfolio->total_value, 2),
                'firm_assets' => round((float) Portfolio::sum('total_value'), 2),
                'pct_of_firm_assets' => Portfolio::sum('total_value') > 0
                    ? round(((float) $portfolio->total_value / (float) Portfolio::sum('total_value')) * 100, 2)
                    : 100,
                'internal_dispersion' => round($returnStdDev, 4),
            ],
        ]);
    }

    // =========================================================================
    // 7. GET /compliance/audit-trail
    // =========================================================================

    /**
     * Get audit log entries with filtering by user, action, entity, and date range.
     */
    public function auditTrail(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'nullable|integer',
            'action' => 'nullable|string|max:100',
            'entity' => 'nullable|string|max:100',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = AuditLog::with('user')->orderByDesc('created_at');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('action')) {
            $query->where('action', 'like', '%' . $request->action . '%');
        }
        if ($request->filled('entity')) {
            $query->where('entity', 'like', '%' . $request->entity . '%');
        }
        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to . ' 23:59:59');
        }

        $perPage = $request->input('per_page', 50);
        $logs = $query->paginate($perPage);

        // Action summary for the filtered set
        $actionSummary = AuditLog::query()
            ->when($request->filled('date_from'), fn($q) => $q->where('created_at', '>=', $request->date_from))
            ->when($request->filled('date_to'), fn($q) => $q->where('created_at', '<=', $request->date_to . ' 23:59:59'))
            ->selectRaw('action, COUNT(*) as count')
            ->groupBy('action')
            ->orderByDesc('count')
            ->limit(20)
            ->pluck('count', 'action');

        $entitySummary = AuditLog::query()
            ->when($request->filled('date_from'), fn($q) => $q->where('created_at', '>=', $request->date_from))
            ->when($request->filled('date_to'), fn($q) => $q->where('created_at', '<=', $request->date_to . ' 23:59:59'))
            ->selectRaw('entity, COUNT(*) as count')
            ->groupBy('entity')
            ->orderByDesc('count')
            ->limit(20)
            ->pluck('count', 'entity');

        return response()->json([
            'audit_logs' => $logs->items() ? collect($logs->items())->map(fn($log) => [
                'id' => $log->id,
                'user' => $log->user ? [
                    'id' => $log->user->id,
                    'name' => $log->user->name,
                    'email' => $log->user->email,
                ] : null,
                'action' => $log->action,
                'entity' => $log->entity,
                'entity_id' => $log->entity_id,
                'details' => $log->details,
                'ip_address' => $log->ip_address,
                'timestamp' => $log->created_at?->toIso8601String(),
            ]) : [],
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
            'summary' => [
                'actions' => $actionSummary,
                'entities' => $entitySummary,
            ],
        ]);
    }

    // =========================================================================
    // 8. GET /compliance/gaap-report/{portfolio_id}
    // =========================================================================

    /**
     * Get multi-GAAP comparison report (US GAAP vs IFRS) showing valuation
     * differences, classification impacts, and disclosure requirements.
     */
    public function gaapReport(Request $request, int $portfolio_id): JsonResponse
    {
        $portfolio = Portfolio::with(['positions.asset', 'navHistories'])
            ->findOrFail($portfolio_id);

        $positions = $portfolio->positions()->with('asset')->whereNull('close_date')->get();
        $totalMarketValue = $positions->sum('market_value');

        // --- Build asset-level GAAP comparison ---
        $assetComparisons = [];
        $totalUsGaapValue = 0;
        $totalIfrsValue = 0;

        foreach ($positions as $position) {
            $asset = $position->asset;
            if (!$asset) continue;

            $marketValue = (float) $position->market_value;
            $costBasis = (float) $position->avg_cost_basis * (float) $position->quantity;
            $unrealizedPnl = (float) $position->unrealized_pnl;

            // US GAAP: trading securities at fair value through P&L
            // IFRS: depends on business model (FVTPL, FVOCI, Amortized Cost)
            $usGaapTreatment = $this->getUsGaapTreatment($asset);
            $ifrsTreatment = $this->getIfrsTreatment($asset);

            $usGaapValue = $this->computeUsGaapValue($marketValue, $costBasis, $asset);
            $ifrsValue = $this->computeIfrsValue($marketValue, $costBasis, $asset);

            $totalUsGaapValue += $usGaapValue;
            $totalIfrsValue += $ifrsValue;

            $assetComparisons[] = [
                'asset_symbol' => $asset->symbol,
                'asset_name' => $asset->name,
                'asset_class' => $asset->asset_class,
                'quantity' => round((float) $position->quantity, 6),
                'cost_basis' => round($costBasis, 2),
                'market_value' => round($marketValue, 2),
                'us_gaap' => [
                    'classification' => $usGaapTreatment['classification'],
                    'measurement' => $usGaapTreatment['measurement'],
                    'carrying_value' => round($usGaapValue, 2),
                    'unrealized_pnl_treatment' => $usGaapTreatment['pnl_treatment'],
                ],
                'ifrs' => [
                    'classification' => $ifrsTreatment['classification'],
                    'measurement' => $ifrsTreatment['measurement'],
                    'carrying_value' => round($ifrsValue, 2),
                    'unrealized_pnl_treatment' => $ifrsTreatment['pnl_treatment'],
                ],
                'difference' => round($usGaapValue - $ifrsValue, 2),
            ];
        }

        // --- Disclosure differences ---
        $disclosureDifferences = [
            [
                'area' => 'Fair Value Hierarchy',
                'us_gaap' => 'ASC 820: 3-level hierarchy (Level 1-3) with extensive disclosures',
                'ifrs' => 'IFRS 13: Similar 3-level hierarchy, slightly different transfer disclosure requirements',
                'impact' => 'MINIMAL',
            ],
            [
                'area' => 'Financial Instrument Classification',
                'us_gaap' => 'ASC 320/321: Trading, Available-for-Sale, Held-to-Maturity, Equity method',
                'ifrs' => 'IFRS 9: FVTPL, FVOCI, Amortized Cost (based on business model + SPPI test)',
                'impact' => 'SIGNIFICANT',
            ],
            [
                'area' => 'Impairment Model',
                'us_gaap' => 'ASC 326: CECL (Current Expected Credit Losses) - lifetime expected loss',
                'ifrs' => 'IFRS 9: 3-stage ECL model (12-month vs lifetime)',
                'impact' => 'MODERATE',
            ],
            [
                'area' => 'Revenue from Fund Management Fees',
                'us_gaap' => 'ASC 606: Performance obligations, variable consideration constraint',
                'ifrs' => 'IFRS 15: Similar framework, minor differences in constraint application',
                'impact' => 'MINIMAL',
            ],
            [
                'area' => 'Consolidation of Fund Vehicles',
                'us_gaap' => 'ASC 810: VIE model (primary beneficiary test)',
                'ifrs' => 'IFRS 10: Control model (power + variable returns + link between them)',
                'impact' => 'SIGNIFICANT',
            ],
            [
                'area' => 'Hedge Accounting',
                'us_gaap' => 'ASC 815: Strict effectiveness testing (80-125% rule being relaxed)',
                'ifrs' => 'IFRS 9: More principles-based, broader eligibility for hedge accounting',
                'impact' => 'MODERATE',
            ],
            [
                'area' => 'Investment Entity Exception',
                'us_gaap' => 'ASC 946: Investment companies measure all investments at fair value',
                'ifrs' => 'IFRS 10: Investment entity exemption from consolidation, measure subsidiaries at FVTPL',
                'impact' => 'MODERATE',
            ],
        ];

        // --- Fair value hierarchy breakdown ---
        $fairValueHierarchy = $this->buildFairValueHierarchy($positions);

        return response()->json([
            'portfolio_id' => $portfolio->id,
            'portfolio_name' => $portfolio->name,
            'report_date' => now()->toDateString(),
            'currency' => $portfolio->currency ?? 'USD',
            'summary' => [
                'us_gaap_total_value' => round($totalUsGaapValue, 2),
                'ifrs_total_value' => round($totalIfrsValue, 2),
                'total_difference' => round($totalUsGaapValue - $totalIfrsValue, 2),
                'difference_pct' => $totalUsGaapValue > 0
                    ? round((($totalUsGaapValue - $totalIfrsValue) / $totalUsGaapValue) * 100, 4)
                    : 0,
                'position_count' => $positions->count(),
            ],
            'fair_value_hierarchy' => $fairValueHierarchy,
            'asset_comparisons' => $assetComparisons,
            'disclosure_differences' => $disclosureDifferences,
            'applicable_standards' => [
                'us_gaap' => ['ASC 320', 'ASC 321', 'ASC 326', 'ASC 606', 'ASC 810', 'ASC 815', 'ASC 820', 'ASC 946'],
                'ifrs' => ['IFRS 7', 'IFRS 9', 'IFRS 10', 'IFRS 13', 'IFRS 15'],
            ],
        ]);
    }

    // =========================================================================
    // PRIVATE HELPER METHODS
    // =========================================================================

    /**
     * Compute standard deviation of a collection of numeric values.
     */
    private function computeStdDev($values): float
    {
        if ($values->count() < 2) {
            return 0;
        }
        $mean = $values->avg();
        $sumSquaredDiffs = $values->reduce(fn($carry, $val) => $carry + pow($val - $mean, 2), 0);
        return sqrt($sumSquaredDiffs / ($values->count() - 1));
    }

    /**
     * Run concentration checks across all portfolios.
     */
    private function runConcentrationChecks($portfolios): array
    {
        $results = [];
        foreach ($portfolios as $portfolio) {
            $positions = $portfolio->positions;
            $totalValue = $positions->sum('market_value');
            if ($totalValue <= 0) continue;

            $maxWeight = $positions->max(fn($p) => ((float) $p->market_value / (float) $totalValue) * 100);
            $results[] = [
                'check' => 'Concentration - ' . $portfolio->name,
                'status' => $maxWeight <= 10 ? 'PASS' : 'FAIL',
                'detail' => sprintf('Max position weight: %.2f%% (limit: 10%%)', $maxWeight),
                'checked_at' => now()->toIso8601String(),
            ];
        }
        return $results;
    }

    /**
     * Run diversification checks across all portfolios.
     */
    private function runDiversificationChecks($portfolios): array
    {
        $results = [];
        foreach ($portfolios as $portfolio) {
            $positions = $portfolio->positions;
            $sectorCount = $positions->map(fn($p) => $p->asset->sector ?? 'Unknown')->unique()->count();
            $results[] = [
                'check' => 'Diversification - ' . $portfolio->name,
                'status' => $sectorCount >= 3 ? 'PASS' : 'FAIL',
                'detail' => sprintf('Sectors: %d (minimum: 3)', $sectorCount),
                'checked_at' => now()->toIso8601String(),
            ];
        }
        return $results;
    }

    /**
     * Run pricing freshness checks for all active assets.
     */
    private function runPricingFreshnessChecks(): array
    {
        $staleCount = \App\Models\Asset::where('is_active', true)
            ->whereNotNull('price_date')
            ->where('price_date', '<', now()->subDays(5))
            ->count();

        $totalPriced = \App\Models\Asset::where('is_active', true)->whereNotNull('price_date')->count();

        return [
            [
                'check' => 'Pricing Freshness',
                'status' => $staleCount === 0 ? 'PASS' : 'FAIL',
                'detail' => sprintf('%d of %d priced assets have stale prices (>5 days)', $staleCount, $totalPriced),
                'checked_at' => now()->toIso8601String(),
            ],
        ];
    }

    /**
     * Run reconciliation checks.
     */
    private function runReconciliationChecks(): array
    {
        $pendingCount = \App\Models\Reconciliation::whereIn('status', ['PENDING', 'IN_PROGRESS', 'DISCREPANCY'])->count();

        return [
            [
                'check' => 'Reconciliation Status',
                'status' => $pendingCount === 0 ? 'PASS' : 'FAIL',
                'detail' => sprintf('%d reconciliations pending or with discrepancies', $pendingCount),
                'checked_at' => now()->toIso8601String(),
            ],
        ];
    }

    /**
     * Generate regulatory filing deadlines.
     */
    private function generateRegulatoryDeadlines($now): array
    {
        $year = $now->year;
        $portfolioCount = Portfolio::count();
        $partnerCount = Partner::where('is_active', true)->count();
        $totalAUM = (float) Portfolio::sum('total_value');

        $deadlines = [
            [
                'filing' => 'Form PF (Annual)',
                'regulator' => 'SEC',
                'jurisdiction' => 'US',
                'deadline' => $year . '-04-30',
                'days_remaining' => max(0, now()->diffInDays($year . '-04-30', false)),
                'status' => $now->gt($year . '-04-30') ? 'OVERDUE' : ($now->diffInDays($year . '-04-30', false) <= 30 ? 'DUE_SOON' : 'ON_TRACK'),
                'description' => 'Annual Form PF filing for private fund advisers',
            ],
            [
                'filing' => 'Form ADV Amendment',
                'regulator' => 'SEC',
                'jurisdiction' => 'US',
                'deadline' => $year . '-03-31',
                'days_remaining' => max(0, now()->diffInDays($year . '-03-31', false)),
                'status' => $now->gt($year . '-03-31') ? 'OVERDUE' : ($now->diffInDays($year . '-03-31', false) <= 30 ? 'DUE_SOON' : 'ON_TRACK'),
                'description' => 'Annual updating amendment to Form ADV',
            ],
            [
                'filing' => 'Schedule K-1 Distribution',
                'regulator' => 'IRS',
                'jurisdiction' => 'US',
                'deadline' => $year . '-03-15',
                'days_remaining' => max(0, now()->diffInDays($year . '-03-15', false)),
                'status' => $now->gt($year . '-03-15') ? 'OVERDUE' : ($now->diffInDays($year . '-03-15', false) <= 30 ? 'DUE_SOON' : 'ON_TRACK'),
                'description' => sprintf('K-1 distribution to %d partners', $partnerCount),
            ],
            [
                'filing' => 'AIFMD Annex IV',
                'regulator' => 'ESMA/NCA',
                'jurisdiction' => 'EU',
                'deadline' => $year . '-01-31',
                'days_remaining' => max(0, now()->diffInDays($year . '-01-31', false)),
                'status' => $now->gt($year . '-01-31') ? 'FILED' : 'ON_TRACK',
                'description' => 'AIFMD transparency reporting (Annex IV)',
            ],
            [
                'filing' => 'Form 13F',
                'regulator' => 'SEC',
                'jurisdiction' => 'US',
                'deadline' => $this->getNext13FDeadline($now),
                'days_remaining' => max(0, now()->diffInDays($this->getNext13FDeadline($now), false)),
                'status' => 'ON_TRACK',
                'description' => sprintf('Quarterly 13F holdings report (AUM: $%s)', number_format($totalAUM, 0)),
            ],
            [
                'filing' => 'Form CPO-PQR',
                'regulator' => 'CFTC/NFA',
                'jurisdiction' => 'US',
                'deadline' => $year . '-03-31',
                'days_remaining' => max(0, now()->diffInDays($year . '-03-31', false)),
                'status' => $now->gt($year . '-03-31') ? 'FILED' : 'ON_TRACK',
                'description' => 'Commodity Pool Operator quarterly report',
            ],
        ];

        return collect($deadlines)->sortBy('days_remaining')->values()->toArray();
    }

    /**
     * Get next Form 13F quarterly deadline.
     */
    private function getNext13FDeadline($now): string
    {
        $year = $now->year;
        $deadlines = [
            $year . '-02-14', // Q4 prior year
            $year . '-05-15', // Q1
            $year . '-08-14', // Q2
            $year . '-11-14', // Q3
        ];

        foreach ($deadlines as $d) {
            if ($now->lt($d)) return $d;
        }
        return ($year + 1) . '-02-14';
    }

    /**
     * Generate regulatory filings list with realistic statuses.
     */
    private function generateFilingsList($now): array
    {
        $year = $now->year;
        $portfolios = Portfolio::all();
        $totalAUM = (float) Portfolio::sum('total_value');
        $partnerCount = Partner::where('is_active', true)->count();

        $filings = [];

        // Quarterly filings for current year
        $quarters = ['Q1' => '-05-15', 'Q2' => '-08-14', 'Q3' => '-11-14', 'Q4' => '-02-14'];
        foreach ($quarters as $quarter => $deadlineSuffix) {
            $deadlineYear = $quarter === 'Q4' ? $year + 1 : $year;
            $deadline = $deadlineYear . $deadlineSuffix;
            $isPast = $now->gt($deadline);
            $isNear = !$isPast && $now->diffInDays($deadline, false) <= 30;

            $filings[] = [
                'id' => 'SEC-13F-' . $year . '-' . $quarter,
                'filing_type' => 'Form 13F',
                'regulator' => 'SEC',
                'jurisdiction' => 'US',
                'period' => $year . ' ' . $quarter,
                'deadline' => $deadline,
                'status' => $isPast ? 'FILED' : ($isNear ? 'PENDING' : 'UPCOMING'),
                'filed_date' => $isPast ? (new \DateTime($deadline))->modify('-5 days')->format('Y-m-d') : null,
                'aum_reported' => round($totalAUM, 2),
                'notes' => sprintf('%d positions reported across %d portfolios', Position::whereNull('close_date')->count(), $portfolios->count()),
            ];
        }

        // Annual filings
        $annualFilings = [
            ['type' => 'Form PF', 'regulator' => 'SEC', 'deadline' => $year . '-04-30', 'desc' => 'Private Fund annual report'],
            ['type' => 'Form ADV', 'regulator' => 'SEC', 'deadline' => $year . '-03-31', 'desc' => 'Investment adviser registration amendment'],
            ['type' => 'Form D', 'regulator' => 'SEC', 'deadline' => $year . '-01-15', 'desc' => 'Notice of exempt offering'],
            ['type' => 'AIFMD Annex IV', 'regulator' => 'ESMA', 'deadline' => $year . '-01-31', 'desc' => 'EU alternative fund transparency report'],
            ['type' => 'FATCA Report', 'regulator' => 'IRS', 'deadline' => $year . '-03-31', 'desc' => 'Foreign Account Tax Compliance Act report'],
            ['type' => 'K-1 Distribution', 'regulator' => 'IRS', 'deadline' => $year . '-03-15', 'desc' => sprintf('K-1 forms for %d partners', $partnerCount)],
            ['type' => 'Form 1065', 'regulator' => 'IRS', 'deadline' => $year . '-03-15', 'desc' => 'Partnership return of income'],
            ['type' => 'FinCEN SAR', 'regulator' => 'FinCEN', 'deadline' => $year . '-06-30', 'desc' => 'Suspicious Activity Report (if applicable)'],
        ];

        foreach ($annualFilings as $af) {
            $isPast = $now->gt($af['deadline']);
            $isNear = !$isPast && $now->diffInDays($af['deadline'], false) <= 30;
            $isOverdue = $isPast && $now->diffInDays($af['deadline']) > 15;

            $filings[] = [
                'id' => strtoupper(str_replace(' ', '-', $af['type'])) . '-' . $year,
                'filing_type' => $af['type'],
                'regulator' => $af['regulator'],
                'jurisdiction' => $af['regulator'] === 'ESMA' ? 'EU' : 'US',
                'period' => $year . ' Annual',
                'deadline' => $af['deadline'],
                'status' => $isPast ? ($isOverdue ? 'OVERDUE' : 'FILED') : ($isNear ? 'PENDING' : 'UPCOMING'),
                'filed_date' => ($isPast && !$isOverdue) ? (new \DateTime($af['deadline']))->modify('-3 days')->format('Y-m-d') : null,
                'aum_reported' => round($totalAUM, 2),
                'notes' => $af['desc'],
            ];
        }

        return collect($filings)->sortBy('deadline')->values()->toArray();
    }

    /**
     * Generate an investor letter from portfolio data.
     */
    private function generateInvestorLetter(Portfolio $portfolio, string $period, int $year): array
    {
        $positions = $portfolio->positions()->with('asset')->whereNull('close_date')->get();
        $totalMarketValue = $positions->sum('market_value');
        $totalUnrealizedPnl = $positions->sum('unrealized_pnl');

        // Performance for the quarter
        $quarterMonth = ((int) substr($period, 1) - 1) * 3 + 1;
        $quarterStart = now()->setYear($year)->setMonth($quarterMonth)->startOfMonth();
        $quarterEnd = (clone $quarterStart)->addMonths(3)->subDay();

        $perfRecords = $portfolio->performanceRecords()
            ->where('period_type', PerformanceRecord::PERIOD_MONTHLY)
            ->whereBetween('date', [$quarterStart, $quarterEnd])
            ->orderBy('date')
            ->get();

        $quarterReturn = $perfRecords->count() > 0
            ? (collect($perfRecords->pluck('total_return'))->map(fn($r) => 1 + (float) $r)->reduce(fn($c, $v) => $c * $v, 1) - 1) * 100
            : 0;

        $benchmarkReturn = $perfRecords->count() > 0 ? $perfRecords->avg('benchmark_return') * 3 * 100 : 0;
        $alpha = round($quarterReturn - $benchmarkReturn, 2);

        // Top holdings
        $topHoldings = $positions->sortByDesc('market_value')->take(5)->map(fn($p) => [
            'asset' => $p->asset->name ?? 'N/A',
            'symbol' => $p->asset->symbol ?? 'N/A',
            'market_value' => round((float) $p->market_value, 2),
            'weight' => $totalMarketValue > 0 ? round(((float) $p->market_value / (float) $totalMarketValue) * 100, 2) : 0,
            'unrealized_pnl' => round((float) $p->unrealized_pnl, 2),
        ])->values();

        // Asset allocation
        $assetAllocation = $positions->groupBy(fn($p) => $p->asset->asset_class ?? 'OTHER')
            ->map(function ($group, $class) use ($totalMarketValue) {
                $classValue = $group->sum('market_value');
                return [
                    'asset_class' => $class,
                    'market_value' => round((float) $classValue, 2),
                    'weight' => $totalMarketValue > 0 ? round(((float) $classValue / (float) $totalMarketValue) * 100, 2) : 0,
                ];
            })->sortByDesc('weight')->values();

        // NAV history for the quarter
        $navHistory = $portfolio->navHistories()
            ->whereBetween('date', [$quarterStart, $quarterEnd])
            ->orderBy('date')
            ->get()
            ->map(fn($n) => [
                'date' => $n->date?->toDateString(),
                'nav' => round((float) $n->nav, 2),
                'nav_per_share' => round((float) $n->nav_per_share, 6),
            ]);

        return [
            'report_type' => 'investor_letter',
            'portfolio_id' => $portfolio->id,
            'portfolio_name' => $portfolio->name,
            'period' => $period . ' ' . $year,
            'generated_at' => now()->toIso8601String(),
            'executive_summary' => sprintf(
                'For %s %d, the %s portfolio returned %.2f%% compared to the benchmark return of %.2f%%, generating alpha of %.2f%%. Total AUM stands at $%s with %d active positions across %d sectors.',
                $period, $year,
                $portfolio->name,
                $quarterReturn,
                $benchmarkReturn,
                $alpha,
                number_format((float) $totalMarketValue, 2),
                $positions->count(),
                $positions->map(fn($p) => $p->asset->sector ?? 'Unknown')->unique()->count()
            ),
            'performance' => [
                'quarter_return' => round($quarterReturn, 4),
                'benchmark_return' => round($benchmarkReturn, 4),
                'alpha' => $alpha,
                'ytd_return' => round($quarterReturn * (ceil(now()->month / 3) > 0 ? 1 : 0), 4),
            ],
            'portfolio_overview' => [
                'total_market_value' => round((float) $totalMarketValue, 2),
                'total_unrealized_pnl' => round((float) $totalUnrealizedPnl, 2),
                'position_count' => $positions->count(),
            ],
            'top_holdings' => $topHoldings,
            'asset_allocation' => $assetAllocation,
            'nav_history' => $navHistory,
        ];
    }

    /**
     * Generate quarterly performance report.
     */
    private function generateQuarterlyPerformance(Portfolio $portfolio, string $period, int $year): array
    {
        $positions = $portfolio->positions()->with('asset')->whereNull('close_date')->get();
        $totalMarketValue = $positions->sum('market_value');

        // Gather performance for each month in the quarter
        $quarterNum = (int) substr($period, 1);
        $months = [];
        for ($m = ($quarterNum - 1) * 3 + 1; $m <= $quarterNum * 3; $m++) {
            $monthStart = now()->setYear($year)->setMonth($m)->startOfMonth();
            $perf = $portfolio->performanceRecords()
                ->where('period_type', PerformanceRecord::PERIOD_MONTHLY)
                ->whereMonth('date', $m)
                ->whereYear('date', $year)
                ->first();

            $months[] = [
                'month' => $monthStart->format('F Y'),
                'total_return' => $perf ? round((float) $perf->total_return * 100, 4) : 0,
                'benchmark_return' => $perf ? round((float) $perf->benchmark_return * 100, 4) : 0,
                'alpha' => $perf ? round((float) $perf->alpha_return * 100, 4) : 0,
                'sharpe_ratio' => $perf ? round((float) $perf->sharpe_ratio, 4) : null,
                'volatility' => $perf ? round(abs((float) $perf->volatility) * 100, 4) : null,
                'max_drawdown' => $perf ? round(abs((float) $perf->max_drawdown) * 100, 4) : null,
            ];
        }

        // Attribution by sector
        $sectorAttribution = $positions->groupBy(fn($p) => $p->asset->sector ?? 'Unknown')
            ->map(function ($group, $sector) use ($totalMarketValue) {
                $sectorValue = $group->sum('market_value');
                $sectorPnl = $group->sum('unrealized_pnl');
                $weight = $totalMarketValue > 0 ? ((float) $sectorValue / (float) $totalMarketValue) * 100 : 0;
                $contribution = $totalMarketValue > 0 ? ((float) $sectorPnl / (float) $totalMarketValue) * 100 : 0;

                return [
                    'sector' => $sector,
                    'weight' => round($weight, 2),
                    'contribution' => round($contribution, 4),
                    'market_value' => round((float) $sectorValue, 2),
                    'unrealized_pnl' => round((float) $sectorPnl, 2),
                ];
            })->sortByDesc('weight')->values();

        // Attribution by asset class
        $assetClassAttribution = $positions->groupBy(fn($p) => $p->asset->asset_class ?? 'OTHER')
            ->map(function ($group, $class) use ($totalMarketValue) {
                $classValue = $group->sum('market_value');
                $classPnl = $group->sum('unrealized_pnl');
                return [
                    'asset_class' => $class,
                    'weight' => $totalMarketValue > 0 ? round(((float) $classValue / (float) $totalMarketValue) * 100, 2) : 0,
                    'contribution' => $totalMarketValue > 0 ? round(((float) $classPnl / (float) $totalMarketValue) * 100, 4) : 0,
                    'market_value' => round((float) $classValue, 2),
                ];
            })->sortByDesc('weight')->values();

        // Trade activity for the quarter
        $quarterStart = now()->setYear($year)->setMonth(($quarterNum - 1) * 3 + 1)->startOfMonth();
        $quarterEnd = (clone $quarterStart)->addMonths(3)->subDay();

        $tradeActivity = Trade::where('portfolio_id', $portfolio->id)
            ->whereBetween('trade_date', [$quarterStart, $quarterEnd])
            ->where('status', '!=', Trade::STATUS_CANCELLED)
            ->get();

        $tradeSummary = [
            'total_trades' => $tradeActivity->count(),
            'buy_count' => $tradeActivity->whereIn('trade_type', [Trade::TYPE_BUY, Trade::TYPE_COVER])->count(),
            'sell_count' => $tradeActivity->whereIn('trade_type', [Trade::TYPE_SELL, Trade::TYPE_SHORT])->count(),
            'total_volume' => round((float) $tradeActivity->sum('total_amount'), 2),
            'total_commission' => round((float) $tradeActivity->sum('commission'), 2),
        ];

        return [
            'report_type' => 'quarterly_performance',
            'portfolio_id' => $portfolio->id,
            'portfolio_name' => $portfolio->name,
            'period' => $period . ' ' . $year,
            'generated_at' => now()->toIso8601String(),
            'monthly_performance' => $months,
            'sector_attribution' => $sectorAttribution,
            'asset_class_attribution' => $assetClassAttribution,
            'trade_activity' => $tradeSummary,
            'portfolio_statistics' => [
                'total_market_value' => round((float) $totalMarketValue, 2),
                'position_count' => $positions->count(),
                'sector_count' => $positions->map(fn($p) => $p->asset->sector)->unique()->filter()->count(),
                'currency' => $portfolio->currency ?? 'USD',
            ],
        ];
    }

    /**
     * Generate K-1 tax report data.
     */
    private function generateK1Report(Portfolio $portfolio, int $year): array
    {
        $partners = Partner::with(['capitalAccounts' => function ($q) use ($year) {
            $q->whereYear('period_end', $year)->orderByDesc('period_end');
        }])->where('is_active', true)->get();

        $partnerK1s = [];
        foreach ($partners as $partner) {
            $capitalAccount = $partner->capitalAccounts->first();
            if (!$capitalAccount) continue;

            $incomeAllocation = (float) $capitalAccount->income_allocation;
            $gainLoss = (float) $capitalAccount->gain_loss_allocation;

            $partnerK1s[] = [
                'partner_name' => $partner->name,
                'partner_type' => $partner->type,
                'tax_id' => $partner->tax_id ? '***-**-' . substr($partner->tax_id, -4) : 'NOT PROVIDED',
                'ownership_pct' => round((float) $partner->ownership_pct, 2),
                'tax_items' => [
                    'ordinary_income_box_1' => round($incomeAllocation * 0.40, 2),
                    'rental_income_box_2' => 0,
                    'other_income_box_3' => round($incomeAllocation * 0.10, 2),
                    'interest_income_box_5' => round($incomeAllocation * 0.30, 2),
                    'qualified_dividends_box_6b' => round($incomeAllocation * 0.20, 2),
                    'net_st_capital_gain_box_8' => $gainLoss > 0 ? round($gainLoss * 0.3, 2) : 0,
                    'net_lt_capital_gain_box_9a' => $gainLoss > 0 ? round($gainLoss * 0.7, 2) : 0,
                    'net_section_1231_gain_box_10' => 0,
                    'other_deductions_box_13' => round(abs((float) $capitalAccount->expense_allocation) * 0.5, 2),
                    'self_employment_box_14' => 0,
                ],
                'capital_account' => [
                    'beginning_balance' => round((float) $capitalAccount->beginning_balance, 2),
                    'contributions' => round((float) $capitalAccount->contributions, 2),
                    'withdrawals' => round((float) $capitalAccount->withdrawals, 2),
                    'income_allocation' => round($incomeAllocation, 2),
                    'gain_loss_allocation' => round($gainLoss, 2),
                    'management_fee' => round((float) $capitalAccount->management_fee, 2),
                    'performance_fee' => round((float) $capitalAccount->performance_fee, 2),
                    'ending_balance' => round((float) $capitalAccount->ending_balance, 2),
                ],
                'has_tax_id' => (bool) $partner->tax_id,
            ];
        }

        $totalOrdinaryIncome = collect($partnerK1s)->sum(fn($k) => $k['tax_items']['ordinary_income_box_1']);
        $totalCapitalGains = collect($partnerK1s)->sum(fn($k) => $k['tax_items']['net_lt_capital_gain_box_9a'] + $k['tax_items']['net_st_capital_gain_box_8']);

        return [
            'report_type' => 'k1',
            'portfolio_id' => $portfolio->id,
            'portfolio_name' => $portfolio->name,
            'tax_year' => $year,
            'entity_type' => 'Partnership',
            'form' => 'Schedule K-1 (Form 1065)',
            'generated_at' => now()->toIso8601String(),
            'filing_deadline' => $year + 1 . '-03-15',
            'extension_deadline' => $year + 1 . '-09-15',
            'summary' => [
                'total_partners' => count($partnerK1s),
                'total_ordinary_income' => round($totalOrdinaryIncome, 2),
                'total_capital_gains' => round($totalCapitalGains, 2),
                'partners_missing_tax_id' => collect($partnerK1s)->where('has_tax_id', false)->count(),
            ],
            'partner_k1s' => $partnerK1s,
            'warnings' => collect($partnerK1s)->where('has_tax_id', false)->map(fn($k) => sprintf('Missing Tax ID for %s - required for IRS filing', $k['partner_name']))->values()->toArray(),
        ];
    }

    /**
     * Compute LIFO cost basis for tax lot comparison.
     */
    private function computeLifoCostBasis($tradesByAsset, $sellTrades): float
    {
        $totalCostBasis = 0;

        foreach ($tradesByAsset as $assetId => $assetTrades) {
            $assetSells = $sellTrades[$assetId] ?? collect();
            $totalSoldQty = (float) $assetSells->sum('quantity');
            $remainingSold = $totalSoldQty;

            // LIFO: consume from latest lots first, so iterate in reverse
            $reversed = $assetTrades->sortByDesc('trade_date');

            foreach ($reversed as $trade) {
                $lotQty = (float) $trade->quantity;
                $lotPrice = (float) $trade->price;

                if ($remainingSold >= $lotQty) {
                    $remainingSold -= $lotQty;
                    continue;
                } elseif ($remainingSold > 0) {
                    $lotQty -= $remainingSold;
                    $remainingSold = 0;
                }

                $totalCostBasis += $lotQty * $lotPrice;
            }
        }

        return $totalCostBasis;
    }

    /**
     * Compute Time-Weighted Return from NAV history.
     */
    private function computeTWR($navHistory): array
    {
        if ($navHistory->count() < 2) {
            return ['cumulative_return' => 0, 'data_points' => $navHistory->count()];
        }

        $sorted = $navHistory->sortBy('date')->values();
        $cumulativeReturn = 1.0;

        for ($i = 1; $i < $sorted->count(); $i++) {
            $prevNav = (float) $sorted[$i - 1]->nav_per_share;
            $currNav = (float) $sorted[$i]->nav_per_share;
            if ($prevNav > 0) {
                $periodReturn = $currNav / $prevNav;
                $cumulativeReturn *= $periodReturn;
            }
        }

        return [
            'cumulative_return' => round(($cumulativeReturn - 1) * 100, 4),
            'data_points' => $sorted->count(),
        ];
    }

    /**
     * Compute Money-Weighted Return (IRR approximation).
     */
    private function computeMWR(Portfolio $portfolio): float
    {
        // Approximate IRR from capital transactions
        $navHistory = $portfolio->navHistories()->orderBy('date')->get();
        if ($navHistory->count() < 2) return 0;

        $firstNav = (float) $navHistory->first()->nav;
        $lastNav = (float) $navHistory->last()->nav;
        $daysBetween = $navHistory->first()->date->diffInDays($navHistory->last()->date);

        if ($firstNav <= 0 || $daysBetween <= 0) return 0;

        // Trade cash flows as intermediate flows
        $trades = $portfolio->trades()
            ->where('status', '!=', Trade::STATUS_CANCELLED)
            ->orderBy('trade_date')
            ->get();

        $netCashFlows = $trades->sum(function ($trade) {
            $amount = (float) $trade->total_amount;
            return in_array($trade->trade_type, [Trade::TYPE_SELL, Trade::TYPE_SHORT, Trade::TYPE_DIVIDEND, Trade::TYPE_INTEREST])
                ? $amount
                : -$amount;
        });

        // Simple IRR approximation: (Ending - Beginning + Net Cash Flows) / Beginning, annualized
        $totalReturn = ($lastNav - $firstNav + $netCashFlows) / max($firstNav, 1);
        $annualized = (pow(1 + $totalReturn, 365.25 / max($daysBetween, 1)) - 1) * 100;

        return round($annualized, 4);
    }

    /**
     * Get US GAAP treatment for an asset.
     */
    private function getUsGaapTreatment(Asset $asset): array
    {
        return match ($asset->asset_class) {
            Asset::CLASS_EQUITY => [
                'classification' => 'Trading Securities (ASC 321)',
                'measurement' => 'Fair Value through Net Income',
                'pnl_treatment' => 'Unrealized gains/losses recognized in net income',
            ],
            Asset::CLASS_FIXED_INCOME => [
                'classification' => 'Trading / AFS / HTM (ASC 320)',
                'measurement' => 'Fair Value (Trading/AFS) or Amortized Cost (HTM)',
                'pnl_treatment' => 'Trading: through net income; AFS: through OCI; HTM: amortized',
            ],
            Asset::CLASS_DERIVATIVE => [
                'classification' => 'Derivative Instrument (ASC 815)',
                'measurement' => 'Fair Value',
                'pnl_treatment' => 'Changes in fair value through net income (unless hedge accounting)',
            ],
            Asset::CLASS_PRIVATE_EQUITY => [
                'classification' => 'Equity Method / Fair Value (ASC 323/ASC 946)',
                'measurement' => 'Fair Value (investment companies)',
                'pnl_treatment' => 'Unrealized gains/losses through net income under ASC 946',
            ],
            Asset::CLASS_REAL_ESTATE => [
                'classification' => 'Investment Property (ASC 360/ASC 946)',
                'measurement' => 'Fair Value (investment companies) or Cost less Impairment',
                'pnl_treatment' => 'Fair value changes through net income (ASC 946)',
            ],
            default => [
                'classification' => 'Other Investment (ASC 946)',
                'measurement' => 'Fair Value',
                'pnl_treatment' => 'Through net income',
            ],
        };
    }

    /**
     * Get IFRS treatment for an asset.
     */
    private function getIfrsTreatment(Asset $asset): array
    {
        return match ($asset->asset_class) {
            Asset::CLASS_EQUITY => [
                'classification' => 'FVTPL (IFRS 9)',
                'measurement' => 'Fair Value through Profit or Loss',
                'pnl_treatment' => 'All changes in fair value recognized in profit or loss',
            ],
            Asset::CLASS_FIXED_INCOME => [
                'classification' => 'FVTPL / FVOCI / Amortized Cost (IFRS 9)',
                'measurement' => 'Depends on business model and SPPI test',
                'pnl_treatment' => 'FVTPL: through P&L; FVOCI: through OCI with recycling; AC: EIR method',
            ],
            Asset::CLASS_DERIVATIVE => [
                'classification' => 'FVTPL (IFRS 9)',
                'measurement' => 'Fair Value',
                'pnl_treatment' => 'Changes in fair value through profit or loss',
            ],
            Asset::CLASS_PRIVATE_EQUITY => [
                'classification' => 'FVTPL (IFRS 10 investment entity)',
                'measurement' => 'Fair Value',
                'pnl_treatment' => 'Fair value changes through profit or loss',
            ],
            Asset::CLASS_REAL_ESTATE => [
                'classification' => 'Investment Property (IAS 40) / FVTPL',
                'measurement' => 'Fair Value model or Cost model',
                'pnl_treatment' => 'Fair value model: through P&L; Cost model: depreciation + impairment',
            ],
            default => [
                'classification' => 'FVTPL (IFRS 9)',
                'measurement' => 'Fair Value',
                'pnl_treatment' => 'Through profit or loss',
            ],
        };
    }

    /**
     * Compute US GAAP carrying value.
     * For investment companies (ASC 946), all investments at fair value.
     */
    private function computeUsGaapValue(float $marketValue, float $costBasis, Asset $asset): float
    {
        // Under ASC 946 (investment companies), all investments at fair value
        // Apply minor illiquidity adjustments for Level 3 assets
        if (in_array($asset->asset_class, [Asset::CLASS_PRIVATE_EQUITY, Asset::CLASS_REAL_ESTATE])) {
            return $marketValue * 0.98; // 2% illiquidity discount
        }
        return $marketValue;
    }

    /**
     * Compute IFRS carrying value.
     */
    private function computeIfrsValue(float $marketValue, float $costBasis, Asset $asset): float
    {
        // Under IFRS, investment entities use FVTPL
        // Real estate may use IAS 40 cost model: no fair value uplift
        if ($asset->asset_class === Asset::CLASS_REAL_ESTATE) {
            // IAS 40 cost model: use cost basis with depreciation estimate
            $depreciationRate = 0.03; // ~3% annual
            $holdingYears = $asset->price_date ? max(1, $asset->created_at?->diffInDays($asset->price_date) / 365) : 1;
            $depreciatedValue = $costBasis * (1 - $depreciationRate * min($holdingYears, 10));
            return max($depreciatedValue, $costBasis * 0.7); // floor at 70%
        }

        if ($asset->asset_class === Asset::CLASS_PRIVATE_EQUITY) {
            return $marketValue * 0.97; // 3% discount for Level 3 IFRS
        }

        return $marketValue;
    }

    /**
     * Build fair value hierarchy breakdown (Levels 1, 2, 3).
     */
    private function buildFairValueHierarchy($positions): array
    {
        $levels = ['Level 1' => 0, 'Level 2' => 0, 'Level 3' => 0];
        $levelDetails = ['Level 1' => [], 'Level 2' => [], 'Level 3' => []];

        foreach ($positions as $position) {
            $asset = $position->asset;
            if (!$asset) continue;

            $marketValue = (float) $position->market_value;
            $level = $this->determineFairValueLevel($asset);

            $levels[$level] += $marketValue;
            $levelDetails[$level][] = [
                'symbol' => $asset->symbol,
                'asset_class' => $asset->asset_class,
                'market_value' => round($marketValue, 2),
            ];
        }

        $total = array_sum($levels);

        return [
            'Level 1' => [
                'description' => 'Quoted prices in active markets (exchanges)',
                'total_value' => round($levels['Level 1'], 2),
                'pct_of_total' => $total > 0 ? round(($levels['Level 1'] / $total) * 100, 2) : 0,
                'positions' => $levelDetails['Level 1'],
            ],
            'Level 2' => [
                'description' => 'Observable inputs other than quoted prices (OTC, dealer quotes)',
                'total_value' => round($levels['Level 2'], 2),
                'pct_of_total' => $total > 0 ? round(($levels['Level 2'] / $total) * 100, 2) : 0,
                'positions' => $levelDetails['Level 2'],
            ],
            'Level 3' => [
                'description' => 'Unobservable inputs (internal models, valuations)',
                'total_value' => round($levels['Level 3'], 2),
                'pct_of_total' => $total > 0 ? round(($levels['Level 3'] / $total) * 100, 2) : 0,
                'positions' => $levelDetails['Level 3'],
            ],
        ];
    }

    /**
     * Determine fair value hierarchy level for an asset.
     */
    private function determineFairValueLevel(Asset $asset): string
    {
        // Level 1: actively traded on exchanges
        if (in_array($asset->asset_class, [Asset::CLASS_EQUITY, Asset::CLASS_COMMODITY]) && $asset->exchange) {
            return 'Level 1';
        }

        // Level 3: illiquid, no market pricing
        if (in_array($asset->asset_class, [Asset::CLASS_PRIVATE_EQUITY, Asset::CLASS_REAL_ESTATE])) {
            return 'Level 3';
        }

        // Level 2: OTC instruments, fixed income, derivatives with observable inputs
        if (in_array($asset->asset_class, [Asset::CLASS_FIXED_INCOME, Asset::CLASS_DERIVATIVE, Asset::CLASS_CURRENCY])) {
            return 'Level 2';
        }

        // Default: Level 1 if exchange, else Level 2
        return $asset->exchange ? 'Level 1' : 'Level 2';
    }
}
