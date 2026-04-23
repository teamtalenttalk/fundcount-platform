<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\CapitalAccount;
use App\Models\Document;
use App\Models\NAVHistory;
use App\Models\Partner;
use App\Models\PerformanceRecord;
use App\Models\Portfolio;
use App\Models\Position;
use App\Models\PriceHistory;
use App\Models\Reconciliation;
use App\Models\Trade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiController extends Controller
{
    /**
     * POST /api/ai/portfolio-analysis
     *
     * AI-driven portfolio risk analysis with sector concentration,
     * volatility metrics, rebalancing suggestions, and anomaly detection.
     */
    public function portfolioAnalysis(Request $request): JsonResponse
    {
        $request->validate([
            'portfolio_id' => 'required|integer|exists:portfolios,id',
        ]);

        $portfolio = Portfolio::with(['positions.asset', 'performanceRecords', 'navHistories'])
            ->findOrFail($request->portfolio_id);

        // --- Sector concentration ---
        $positions = $portfolio->positions()->with('asset')->get();
        $totalMarketValue = $positions->sum('market_value');

        $sectorConcentration = $positions
            ->groupBy(fn($p) => $p->asset->sector ?? 'Unknown')
            ->map(function ($group, $sector) use ($totalMarketValue) {
                $sectorValue = $group->sum('market_value');
                return [
                    'sector' => $sector,
                    'market_value' => round((float) $sectorValue, 2),
                    'weight' => $totalMarketValue > 0 ? round(($sectorValue / $totalMarketValue) * 100, 2) : 0,
                    'position_count' => $group->count(),
                ];
            })
            ->sortByDesc('weight')
            ->values();

        // --- Volatility metrics from performance records ---
        $perfRecords = $portfolio->performanceRecords()
            ->where('period_type', PerformanceRecord::PERIOD_DAILY)
            ->orderByDesc('date')
            ->limit(252) // ~1 year of trading days
            ->get();

        $returns = $perfRecords->pluck('total_return')->map(fn($r) => (float) $r)->filter()->values();
        $avgReturn = $returns->count() > 0 ? $returns->avg() : 0;
        $volatility = $this->computeStdDev($returns);

        $latestPerf = $portfolio->performanceRecords()->orderByDesc('date')->first();
        $sharpeRatio = $latestPerf ? (float) $latestPerf->sharpe_ratio : ($volatility > 0 ? round($avgReturn / $volatility, 4) : 0);
        $maxDrawdown = $latestPerf ? (float) $latestPerf->max_drawdown : $this->computeMaxDrawdown($returns);

        // --- Risk score (0-100) ---
        // Composite: 30% volatility factor, 25% concentration risk, 25% drawdown factor, 20% diversification inverse
        $topSectorWeight = $sectorConcentration->count() > 0 ? $sectorConcentration->first()['weight'] : 100;
        $concentrationRisk = min($topSectorWeight, 100);
        $diversificationScore = $this->computeDiversificationScore($positions, $totalMarketValue);
        $volatilityNorm = min(abs($volatility) * 1000, 100); // normalize: 10% annualized vol => ~100
        $drawdownNorm = min(abs($maxDrawdown) * 100, 100);

        $riskScore = (int) round(
            $volatilityNorm * 0.30 +
            $concentrationRisk * 0.25 +
            $drawdownNorm * 0.25 +
            (100 - $diversificationScore) * 0.20
        );
        $riskScore = max(0, min(100, $riskScore));

        $riskLevel = match (true) {
            $riskScore <= 33 => 'Low',
            $riskScore <= 66 => 'Medium',
            default => 'High',
        };

        // --- Rebalancing suggestions ---
        $rebalancingSuggestions = $this->generateRebalancingSuggestions($positions, $totalMarketValue);

        // --- Anomaly detection ---
        $anomalies = $this->detectAnomalies($portfolio, $returns, $positions);

        return response()->json([
            'portfolio_id' => $portfolio->id,
            'portfolio_name' => $portfolio->name,
            'analysis_date' => now()->toDateString(),
            'risk_score' => $riskScore,
            'risk_level' => $riskLevel,
            'sector_concentration' => $sectorConcentration,
            'volatility_metrics' => [
                'daily_volatility' => round($volatility, 6),
                'annualized_volatility' => round($volatility * sqrt(252), 6),
                'avg_daily_return' => round($avgReturn, 6),
                'data_points' => $returns->count(),
            ],
            'sharpe_ratio' => round($sharpeRatio, 4),
            'max_drawdown' => round($maxDrawdown, 6),
            'diversification_score' => round($diversificationScore, 2),
            'rebalancing_suggestions' => $rebalancingSuggestions,
            'anomalies' => $anomalies,
        ]);
    }

    /**
     * POST /api/ai/query
     *
     * Natural language query engine. Pattern-matches keywords and returns
     * intelligent responses with supporting data and optional chart data.
     */
    public function query(Request $request): JsonResponse
    {
        $request->validate([
            'question' => 'required|string|max:1000',
        ]);

        $question = strtolower(trim($request->question));
        $response = $this->processNaturalLanguageQuery($question);

        return response()->json($response);
    }

    /**
     * POST /api/ai/predictions
     *
     * Predictive analytics: projected returns, NAV series forecasts,
     * cash flow forecast, risk trend, and market signals.
     */
    public function predictions(Request $request): JsonResponse
    {
        $request->validate([
            'portfolio_id' => 'required|integer|exists:portfolios,id',
            'period' => 'required|string|in:30d,90d,6m,1y',
        ]);

        $portfolio = Portfolio::with(['navHistories', 'performanceRecords'])->findOrFail($request->portfolio_id);
        $periodDays = $this->periodToDays($request->period);

        // Historical NAV for trend analysis
        $navHistory = $portfolio->navHistories()
            ->orderByDesc('date')
            ->limit(252)
            ->get()
            ->sortBy('date')
            ->values();

        $navValues = $navHistory->pluck('nav')->map(fn($v) => (float) $v)->values();

        // Historical returns
        $perfRecords = $portfolio->performanceRecords()
            ->where('period_type', PerformanceRecord::PERIOD_DAILY)
            ->orderByDesc('date')
            ->limit(252)
            ->get();
        $returns = $perfRecords->pluck('total_return')->map(fn($r) => (float) $r)->filter()->values();
        $avgReturn = $returns->count() > 0 ? $returns->avg() : 0.0003;
        $volatility = $this->computeStdDev($returns) ?: 0.01;

        // Linear trend on NAV
        $trendSlope = $this->computeLinearTrendSlope($navValues);

        // Predicted return over the period
        $predictedReturn = round($avgReturn * $periodDays, 6);
        $confidenceLow = round($predictedReturn - 1.96 * $volatility * sqrt($periodDays), 6);
        $confidenceHigh = round($predictedReturn + 1.96 * $volatility * sqrt($periodDays), 6);

        // Generate predicted NAV series
        $lastNav = $navValues->count() > 0 ? $navValues->last() : ((float) $portfolio->total_value ?: 100000000);
        $predictedNavSeries = $this->generatePredictedNavSeries($lastNav, $avgReturn, $volatility, $periodDays);

        // Cash flow forecast based on recent trade activity
        $recentTradeVolume = Trade::where('portfolio_id', $portfolio->id)
            ->where('trade_date', '>=', now()->subDays(90))
            ->sum('total_amount');
        $avgMonthlyFlow = $recentTradeVolume > 0 ? round((float) $recentTradeVolume / 3, 2) : 0;

        // Risk trend from recent performance
        $recentVolatilities = $perfRecords->take(30)->pluck('volatility')->map(fn($v) => (float) $v)->filter();
        $olderVolatilities = $perfRecords->skip(30)->take(30)->pluck('volatility')->map(fn($v) => (float) $v)->filter();
        $recentAvgVol = $recentVolatilities->count() > 0 ? $recentVolatilities->avg() : 0;
        $olderAvgVol = $olderVolatilities->count() > 0 ? $olderVolatilities->avg() : 0;
        $riskTrend = $recentAvgVol > $olderAvgVol * 1.1 ? 'increasing' : ($recentAvgVol < $olderAvgVol * 0.9 ? 'decreasing' : 'stable');

        // Market signals
        $marketSignals = $this->generateMarketSignals($returns, $navValues, $trendSlope);

        return response()->json([
            'portfolio_id' => $portfolio->id,
            'portfolio_name' => $portfolio->name,
            'period' => $request->period,
            'period_days' => $periodDays,
            'generated_at' => now()->toIso8601String(),
            'predicted_return' => $predictedReturn,
            'confidence_interval' => [
                'low' => $confidenceLow,
                'high' => $confidenceHigh,
                'confidence_level' => '95%',
            ],
            'predicted_nav_series' => $predictedNavSeries,
            'cash_flow_forecast' => [
                'avg_monthly_volume' => $avgMonthlyFlow,
                'projected_inflows' => round($avgMonthlyFlow * 0.6, 2),
                'projected_outflows' => round($avgMonthlyFlow * 0.4, 2),
                'net_flow' => round($avgMonthlyFlow * 0.2, 2),
            ],
            'risk_trend' => $riskTrend,
            'market_signals' => $marketSignals,
        ]);
    }

    /**
     * POST /api/ai/reconciliation
     *
     * Automated trade reconciliation analysis: matches, breaks, and suggested actions.
     */
    public function reconciliation(Request $request): JsonResponse
    {
        $trades = Trade::with(['portfolio', 'asset'])
            ->orderByDesc('trade_date')
            ->limit(200)
            ->get();

        $totalTrades = $trades->count();

        // Simulate reconciliation by analyzing trade consistency
        $matched = [];
        $unmatched = [];
        $breaks = [];

        foreach ($trades as $trade) {
            $amount = (float) $trade->total_amount;
            $qty = (float) $trade->quantity;
            $price = (float) $trade->price;
            $computedAmount = round($qty * $price, 4);
            $commission = (float) $trade->commission;
            $fees = (float) $trade->fees;
            $expectedTotal = round($computedAmount + $commission + $fees, 4);
            $difference = round(abs($amount - $expectedTotal), 4);

            if ($trade->status === Trade::STATUS_CANCELLED) {
                continue;
            }

            if ($difference < 0.01) {
                $matched[] = $trade->id;
            } else {
                $unmatched[] = $trade->id;
                $breaks[] = [
                    'trade_id' => $trade->id,
                    'trade_number' => $trade->trade_number,
                    'type' => $difference > $amount * 0.01 ? 'AMOUNT_MISMATCH' : 'ROUNDING_DIFFERENCE',
                    'custodian_value' => $amount,
                    'internal_value' => $expectedTotal,
                    'difference' => $difference,
                    'status' => $difference > $amount * 0.05 ? 'NEEDS_REVIEW' : 'AUTO_RESOLVED',
                    'suggested_action' => $difference > $amount * 0.05
                        ? 'Manual review required - difference exceeds 5% threshold'
                        : 'Auto-resolve: rounding difference within tolerance',
                ];
            }
        }

        // Also pull account-level reconciliations from Reconciliation model
        $accountReconciliations = Reconciliation::with('account')
            ->orderByDesc('period_end')
            ->limit(20)
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'account' => $r->account->name ?? 'N/A',
                'period' => $r->period_start?->toDateString() . ' to ' . $r->period_end?->toDateString(),
                'book_balance' => (float) $r->book_balance,
                'bank_balance' => (float) $r->bank_balance,
                'difference' => (float) $r->difference,
                'status' => $r->status,
            ]);

        $matchedCount = count($matched);
        $unmatchedCount = count($unmatched);
        $matchRate = $totalTrades > 0 ? round(($matchedCount / $totalTrades) * 100, 2) : 100;

        return response()->json([
            'analysis_date' => now()->toDateString(),
            'total_trades' => $totalTrades,
            'matched_count' => $matchedCount,
            'unmatched_count' => $unmatchedCount,
            'match_rate' => $matchRate,
            'breaks' => array_slice($breaks, 0, 50), // cap at 50 for response size
            'account_reconciliations' => $accountReconciliations,
            'summary' => [
                'auto_resolved' => collect($breaks)->where('status', 'AUTO_RESOLVED')->count(),
                'needs_review' => collect($breaks)->where('status', 'NEEDS_REVIEW')->count(),
                'total_difference' => round(collect($breaks)->sum('difference'), 2),
            ],
        ]);
    }

    /**
     * POST /api/ai/document-process
     *
     * Simulated document processing: extracts fields, validates, and suggests journal entries.
     */
    public function documentProcess(Request $request): JsonResponse
    {
        $request->validate([
            'document_type' => 'required|string|in:trade_confirmation,statement,k1',
        ]);

        $docType = $request->document_type;

        // Pull real data to base the extraction simulation on
        $latestTrade = Trade::with(['portfolio', 'asset'])->orderByDesc('trade_date')->first();
        $latestPartner = Partner::where('is_active', true)->first();
        $latestCapital = CapitalAccount::orderByDesc('period_end')->first();

        $result = match ($docType) {
            'trade_confirmation' => $this->processTradeConfirmation($latestTrade),
            'statement' => $this->processStatement($latestCapital, $latestPartner),
            'k1' => $this->processK1($latestPartner, $latestCapital),
        };

        return response()->json($result);
    }

    /**
     * POST /api/ai/nav-calculate
     *
     * Real-time NAV calculation from positions, liabilities, and pricing.
     */
    public function navCalculate(Request $request): JsonResponse
    {
        $request->validate([
            'portfolio_id' => 'required|integer|exists:portfolios,id',
        ]);

        $portfolio = Portfolio::findOrFail($request->portfolio_id);
        $positions = Position::with('asset')
            ->where('portfolio_id', $portfolio->id)
            ->whereNull('close_date')
            ->get();

        // Total assets from positions
        $totalAssets = $positions->sum('market_value');

        // Components by asset class
        $components = $positions
            ->groupBy(fn($p) => $p->asset->asset_class ?? 'OTHER')
            ->map(function ($group, $assetClass) use ($totalAssets) {
                $classValue = $group->sum('market_value');
                // Compute a synthetic daily change from unrealized PnL vs market value
                $unrealizedPnl = $group->sum('unrealized_pnl');
                $costBasis = $group->sum(fn($p) => (float) $p->avg_cost_basis * (float) $p->quantity);
                $dailyChange = $costBasis > 0 ? round(($unrealizedPnl / $costBasis) * 100, 4) : 0;

                return [
                    'asset_class' => $assetClass,
                    'value' => round((float) $classValue, 2),
                    'weight' => $totalAssets > 0 ? round(((float) $classValue / (float) $totalAssets) * 100, 2) : 0,
                    'daily_change' => $dailyChange,
                    'position_count' => $group->count(),
                ];
            })
            ->sortByDesc('value')
            ->values();

        // Liabilities estimate from the latest NAV history record
        $latestNav = $portfolio->navHistories()->orderByDesc('date')->first();
        $totalLiabilities = $latestNav ? (float) $latestNav->total_liabilities : 0;
        $sharesOutstanding = $latestNav ? (float) $latestNav->shares_outstanding : 1;

        $nav = round((float) $totalAssets - $totalLiabilities, 2);
        $navPerShare = $sharesOutstanding > 0 ? round($nav / $sharesOutstanding, 6) : $nav;

        // Pricing sources and stale price detection
        $pricingSources = [];
        $stalePrices = [];
        $fairValueAdjustments = [];
        $now = now();

        foreach ($positions as $position) {
            $asset = $position->asset;
            if (!$asset) continue;

            $source = $asset->exchange ?: ($asset->asset_class === Asset::CLASS_PRIVATE_EQUITY ? 'Internal Valuation' : 'Market Data');
            $pricingSources[$asset->symbol] = [
                'symbol' => $asset->symbol,
                'source' => $source,
                'price' => (float) $asset->current_price,
                'price_date' => $asset->price_date?->toDateString(),
            ];

            // Stale if price date is older than 3 business days
            if ($asset->price_date && $asset->price_date->diffInDays($now) > 5) {
                $stalePrices[] = [
                    'symbol' => $asset->symbol,
                    'name' => $asset->name,
                    'last_price_date' => $asset->price_date->toDateString(),
                    'days_stale' => $asset->price_date->diffInDays($now),
                    'current_price' => (float) $asset->current_price,
                ];
            }

            // Fair value adjustments for illiquid asset classes
            if (in_array($asset->asset_class, [Asset::CLASS_PRIVATE_EQUITY, Asset::CLASS_REAL_ESTATE])) {
                $adjustment = round((float) $position->market_value * 0.02, 2); // 2% illiquidity discount
                $fairValueAdjustments[] = [
                    'symbol' => $asset->symbol,
                    'name' => $asset->name,
                    'asset_class' => $asset->asset_class,
                    'reported_value' => round((float) $position->market_value, 2),
                    'adjustment' => -$adjustment,
                    'fair_value' => round((float) $position->market_value - $adjustment, 2),
                    'reason' => 'Illiquidity discount (2%)',
                ];
            }
        }

        return response()->json([
            'portfolio_id' => $portfolio->id,
            'portfolio_name' => $portfolio->name,
            'calculation_date' => now()->toIso8601String(),
            'nav' => $nav,
            'nav_per_share' => $navPerShare,
            'total_assets' => round((float) $totalAssets, 2),
            'total_liabilities' => round($totalLiabilities, 2),
            'shares_outstanding' => $sharesOutstanding,
            'components' => $components,
            'pricing_sources' => array_values($pricingSources),
            'stale_prices' => $stalePrices,
            'fair_value_adjustments' => $fairValueAdjustments,
        ]);
    }

    /**
     * GET /api/ai/dashboard
     *
     * AI Dashboard overview: insights, alerts, reconciliation status, portfolio health.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $portfolios = Portfolio::with(['positions.asset', 'performanceRecords' => function ($q) {
            $q->orderByDesc('date')->limit(5);
        }])->get();

        // --- Portfolio health scores ---
        $portfolioHealthScores = $portfolios->map(function ($portfolio) {
            $positions = $portfolio->positions;
            $totalValue = $positions->sum('market_value');
            $latestPerf = $portfolio->performanceRecords->first();

            // Health score based on diversification, performance, and risk
            $positionCount = $positions->count();
            $diversificationFactor = min($positionCount * 5, 40); // max 40 points
            $returnFactor = $latestPerf ? min(max(((float) $latestPerf->total_return + 0.05) * 400, 0), 30) : 15;
            $riskFactor = $latestPerf ? max(30 - abs((float) $latestPerf->max_drawdown) * 300, 0) : 20;

            $score = (int) round($diversificationFactor + $returnFactor + $riskFactor);
            $score = max(0, min(100, $score));

            $recentReturns = $portfolio->performanceRecords->take(3)->pluck('total_return')->map(fn($r) => (float) $r);
            $trend = 'stable';
            if ($recentReturns->count() >= 2) {
                $trend = $recentReturns->first() > $recentReturns->last() ? 'improving' : ($recentReturns->first() < $recentReturns->last() ? 'declining' : 'stable');
            }

            return [
                'portfolio_id' => $portfolio->id,
                'name' => $portfolio->name,
                'score' => $score,
                'trend' => $trend,
                'total_value' => round((float) $totalValue, 2),
            ];
        });

        // --- Risk alerts ---
        $riskAlerts = [];
        foreach ($portfolios as $portfolio) {
            $positions = $portfolio->positions;
            $totalValue = $positions->sum('market_value');

            // Check for concentration risk
            if ($totalValue > 0) {
                foreach ($positions as $position) {
                    $weight = ((float) $position->market_value / (float) $totalValue) * 100;
                    if ($weight > 25) {
                        $riskAlerts[] = [
                            'type' => 'CONCENTRATION',
                            'severity' => 'high',
                            'portfolio' => $portfolio->name,
                            'message' => sprintf(
                                '%s represents %.1f%% of %s - exceeds 25%% concentration limit',
                                $position->asset->symbol ?? 'Unknown',
                                $weight,
                                $portfolio->name
                            ),
                            'date' => now()->toDateString(),
                        ];
                    }
                }
            }

            // Check for large unrealized losses
            foreach ($positions as $position) {
                $unrealizedPnl = (float) $position->unrealized_pnl;
                $marketValue = (float) $position->market_value;
                if ($marketValue > 0 && $unrealizedPnl < 0 && abs($unrealizedPnl) > $marketValue * 0.15) {
                    $riskAlerts[] = [
                        'type' => 'UNREALIZED_LOSS',
                        'severity' => abs($unrealizedPnl) > $marketValue * 0.3 ? 'high' : 'medium',
                        'portfolio' => $portfolio->name,
                        'message' => sprintf(
                            '%s has unrealized loss of $%s (%.1f%% of position value)',
                            $position->asset->symbol ?? 'Unknown',
                            number_format(abs($unrealizedPnl), 2),
                            abs($unrealizedPnl) / $marketValue * 100
                        ),
                        'date' => now()->toDateString(),
                    ];
                }
            }
        }

        // --- Recent insights ---
        $recentInsights = $this->generateRecentInsights($portfolios);

        // --- Reconciliation status ---
        $pendingReconciliations = Reconciliation::whereIn('status', [
            Reconciliation::STATUS_PENDING,
            Reconciliation::STATUS_IN_PROGRESS,
            Reconciliation::STATUS_DISCREPANCY,
        ])->count();

        $documentsProcessed = Document::count();

        // --- Market pulse ---
        $allReturns = PerformanceRecord::where('period_type', PerformanceRecord::PERIOD_DAILY)
            ->orderByDesc('date')
            ->limit(30)
            ->pluck('total_return')
            ->map(fn($r) => (float) $r);
        $avgRecentReturn = $allReturns->count() > 0 ? $allReturns->avg() : 0;
        $sentiment = $avgRecentReturn > 0.001 ? 'bullish' : ($avgRecentReturn < -0.001 ? 'bearish' : 'neutral');
        $vixEstimate = round(max(10, min(40, abs($this->computeStdDev($allReturns)) * sqrt(252) * 100)), 1);

        return response()->json([
            'overview' => [
                'total_insights' => count($recentInsights),
                'risk_alerts' => count($riskAlerts),
                'pending_reconciliations' => $pendingReconciliations,
                'documents_processed' => $documentsProcessed,
            ],
            'recent_insights' => $recentInsights,
            'risk_alerts' => array_slice($riskAlerts, 0, 20),
            'portfolio_health_scores' => $portfolioHealthScores,
            'market_pulse' => [
                'sentiment' => $sentiment,
                'vix' => $vixEstimate,
                'trend' => $avgRecentReturn > 0 ? 'upward' : ($avgRecentReturn < 0 ? 'downward' : 'flat'),
                'avg_recent_return' => round($avgRecentReturn, 6),
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
     * Compute maximum drawdown from a series of returns.
     */
    private function computeMaxDrawdown($returns): float
    {
        if ($returns->count() < 2) {
            return 0;
        }

        $cumulative = 1.0;
        $peak = 1.0;
        $maxDrawdown = 0.0;

        foreach ($returns as $ret) {
            $cumulative *= (1 + $ret);
            $peak = max($peak, $cumulative);
            $drawdown = ($peak - $cumulative) / $peak;
            $maxDrawdown = max($maxDrawdown, $drawdown);
        }

        return round($maxDrawdown, 6);
    }

    /**
     * Compute diversification score (0-100) based on HHI inverse.
     */
    private function computeDiversificationScore($positions, $totalMarketValue): float
    {
        if ($totalMarketValue <= 0 || $positions->isEmpty()) {
            return 0;
        }

        $weights = $positions->map(fn($p) => (float) $p->market_value / (float) $totalMarketValue);
        $hhi = $weights->reduce(fn($carry, $w) => $carry + pow($w, 2), 0);

        // HHI ranges from 1/n (perfect diversification) to 1 (single position)
        // Score: 100 when HHI is minimal, 0 when HHI = 1
        $n = $positions->count();
        $minHHI = $n > 0 ? 1 / $n : 1;
        $maxHHI = 1;

        if ($maxHHI - $minHHI == 0) {
            return $n > 1 ? 100 : 0;
        }

        return max(0, min(100, (1 - ($hhi - $minHHI) / ($maxHHI - $minHHI)) * 100));
    }

    /**
     * Generate rebalancing suggestions by comparing current weights to target model.
     */
    private function generateRebalancingSuggestions($positions, $totalMarketValue): array
    {
        if ($totalMarketValue <= 0) {
            return [];
        }

        // Target weights by asset class (a balanced model portfolio)
        $targetWeights = [
            'EQUITY' => 45,
            'FIXED_INCOME' => 30,
            'PRIVATE_EQUITY' => 10,
            'REAL_ESTATE' => 5,
            'COMMODITY' => 5,
            'CASH' => 5,
        ];

        $currentWeights = $positions
            ->groupBy(fn($p) => $p->asset->asset_class ?? 'OTHER')
            ->map(fn($group) => round(($group->sum('market_value') / (float) $totalMarketValue) * 100, 2));

        $suggestions = [];
        foreach ($targetWeights as $assetClass => $targetWeight) {
            $currentWeight = (float) ($currentWeights[$assetClass] ?? 0);
            $diff = $currentWeight - $targetWeight;

            if (abs($diff) > 2) { // Only suggest if deviation > 2%
                $suggestions[] = [
                    'asset_class' => $assetClass,
                    'current_weight' => $currentWeight,
                    'target_weight' => $targetWeight,
                    'action' => $diff > 0 ? 'REDUCE' : 'INCREASE',
                    'reason' => $diff > 0
                        ? sprintf('Overweight by %.1f%% - consider reducing exposure to rebalance', abs($diff))
                        : sprintf('Underweight by %.1f%% - consider increasing allocation for diversification', abs($diff)),
                ];
            }
        }

        // Also flag any asset classes not in target model
        foreach ($currentWeights as $assetClass => $weight) {
            if (!isset($targetWeights[$assetClass]) && $weight > 3) {
                $suggestions[] = [
                    'asset_class' => $assetClass,
                    'current_weight' => $weight,
                    'target_weight' => 0,
                    'action' => 'REVIEW',
                    'reason' => sprintf('%s allocation at %.1f%% is outside target model - review strategic fit', $assetClass, $weight),
                ];
            }
        }

        return $suggestions;
    }

    /**
     * Detect anomalies in portfolio data.
     */
    private function detectAnomalies($portfolio, $returns, $positions): array
    {
        $anomalies = [];

        // 1. Return outliers (beyond 2 std devs)
        if ($returns->count() > 10) {
            $mean = $returns->avg();
            $stdDev = $this->computeStdDev($returns);
            $threshold = $stdDev * 2;

            foreach ($returns as $i => $ret) {
                if (abs($ret - $mean) > $threshold) {
                    $anomalies[] = [
                        'type' => 'RETURN_OUTLIER',
                        'description' => sprintf('Abnormal daily return of %.2f%% detected (%.1f standard deviations from mean)', $ret * 100, abs($ret - $mean) / max($stdDev, 0.0001)),
                        'severity' => abs($ret - $mean) > $threshold * 1.5 ? 'high' : 'medium',
                        'date' => now()->subDays($i)->toDateString(),
                    ];
                }
                if (count($anomalies) >= 5) break; // cap anomaly count
            }
        }

        // 2. Position weight anomalies
        $totalValue = $positions->sum('market_value');
        if ($totalValue > 0) {
            foreach ($positions as $position) {
                $weight = ((float) $position->market_value / (float) $totalValue) * 100;
                if ($weight > 30) {
                    $anomalies[] = [
                        'type' => 'CONCENTRATION_RISK',
                        'description' => sprintf('%s has %.1f%% portfolio weight - exceeds 30%% single-position limit', $position->asset->symbol ?? 'Unknown', $weight),
                        'severity' => 'high',
                        'date' => now()->toDateString(),
                    ];
                }
            }
        }

        // 3. Unusual trade patterns (multiple trades same day/asset)
        $recentTrades = Trade::where('portfolio_id', $portfolio->id)
            ->where('trade_date', '>=', now()->subDays(30))
            ->get()
            ->groupBy(fn($t) => $t->trade_date?->toDateString() . '_' . $t->asset_id);

        foreach ($recentTrades as $key => $trades) {
            if ($trades->count() > 3) {
                $first = $trades->first();
                $anomalies[] = [
                    'type' => 'UNUSUAL_TRADING',
                    'description' => sprintf('%d trades for %s on %s - possible wash trading or error', $trades->count(), $first->asset->symbol ?? 'Unknown', $first->trade_date?->toDateString()),
                    'severity' => 'medium',
                    'date' => $first->trade_date?->toDateString() ?? now()->toDateString(),
                ];
            }
        }

        return array_slice($anomalies, 0, 10);
    }

    /**
     * Process natural language queries with keyword matching and data retrieval.
     */
    private function processNaturalLanguageQuery(string $question): array
    {
        // Performance queries
        if (preg_match('/performance|return|gain|loss/', $question)) {
            $records = PerformanceRecord::with('portfolio')
                ->where('period_type', PerformanceRecord::PERIOD_MONTHLY)
                ->orderByDesc('date')
                ->limit(12)
                ->get();

            $chartData = $records->map(fn($r) => [
                'date' => $r->date?->toDateString(),
                'return' => round((float) $r->total_return * 100, 2),
                'benchmark' => round((float) $r->benchmark_return * 100, 2),
                'alpha' => round((float) $r->alpha_return * 100, 2),
            ])->sortBy('date')->values();

            $avgReturn = $records->avg('total_return');
            $bestMonth = $records->sortByDesc('total_return')->first();
            $worstMonth = $records->sortBy('total_return')->first();

            return [
                'answer' => sprintf(
                    'Over the last %d months, the average monthly return is %.2f%%. The best month was %s with %.2f%% and the worst was %s with %.2f%%. Current alpha vs benchmark is %.2f%%.',
                    $records->count(),
                    ($avgReturn ?? 0) * 100,
                    $bestMonth?->date?->format('M Y') ?? 'N/A',
                    ($bestMonth?->total_return ?? 0) * 100,
                    $worstMonth?->date?->format('M Y') ?? 'N/A',
                    ($worstMonth?->total_return ?? 0) * 100,
                    ($records->avg('alpha_return') ?? 0) * 100
                ),
                'data_type' => 'performance',
                'data' => $records->map(fn($r) => [
                    'portfolio' => $r->portfolio->name ?? 'N/A',
                    'date' => $r->date?->toDateString(),
                    'total_return' => round((float) $r->total_return * 100, 2) . '%',
                    'alpha' => round((float) $r->alpha_return * 100, 2) . '%',
                    'sharpe' => round((float) $r->sharpe_ratio, 2),
                ])->values(),
                'chart_data' => $chartData,
            ];
        }

        // NAV queries
        if (preg_match('/nav|net asset|value/', $question)) {
            $navRecords = NAVHistory::with('portfolio')
                ->orderByDesc('date')
                ->limit(30)
                ->get();

            $latestByPortfolio = $navRecords->groupBy('portfolio_id')->map(fn($group) => $group->sortByDesc('date')->first());

            $chartData = $navRecords->sortBy('date')->map(fn($n) => [
                'date' => $n->date?->toDateString(),
                'nav' => round((float) $n->nav, 2),
                'portfolio' => $n->portfolio->name ?? 'N/A',
            ])->values();

            return [
                'answer' => sprintf(
                    'Current NAV across %d portfolios totals $%s. The latest NAV per share ranges from $%s to $%s.',
                    $latestByPortfolio->count(),
                    number_format($latestByPortfolio->sum(fn($n) => (float) $n->nav), 2),
                    number_format($latestByPortfolio->min(fn($n) => (float) $n->nav_per_share), 2),
                    number_format($latestByPortfolio->max(fn($n) => (float) $n->nav_per_share), 2)
                ),
                'data_type' => 'nav',
                'data' => $latestByPortfolio->map(fn($n) => [
                    'portfolio' => $n->portfolio->name ?? 'N/A',
                    'date' => $n->date?->toDateString(),
                    'nav' => '$' . number_format((float) $n->nav, 2),
                    'nav_per_share' => '$' . number_format((float) $n->nav_per_share, 2),
                    'shares_outstanding' => number_format((float) $n->shares_outstanding, 0),
                ])->values(),
                'chart_data' => $chartData,
            ];
        }

        // Top holdings / positions
        if (preg_match('/top|largest|biggest|holding|position/', $question)) {
            $topPositions = Position::with(['asset', 'portfolio'])
                ->whereNull('close_date')
                ->orderByDesc('market_value')
                ->limit(10)
                ->get();

            return [
                'answer' => sprintf(
                    'The top %d holdings have a combined market value of $%s. The largest position is %s at $%s.',
                    $topPositions->count(),
                    number_format($topPositions->sum('market_value'), 2),
                    $topPositions->first()?->asset->name ?? 'N/A',
                    number_format((float) ($topPositions->first()?->market_value ?? 0), 2)
                ),
                'data_type' => 'positions',
                'data' => $topPositions->map(fn($p) => [
                    'asset' => $p->asset->name ?? 'N/A',
                    'symbol' => $p->asset->symbol ?? 'N/A',
                    'portfolio' => $p->portfolio->name ?? 'N/A',
                    'market_value' => '$' . number_format((float) $p->market_value, 2),
                    'unrealized_pnl' => '$' . number_format((float) $p->unrealized_pnl, 2),
                    'weight' => round((float) $p->weight * 100, 2) . '%',
                ])->values(),
                'chart_data' => $topPositions->map(fn($p) => [
                    'name' => $p->asset->symbol ?? 'Unknown',
                    'value' => round((float) $p->market_value, 2),
                ])->values(),
            ];
        }

        // Risk queries
        if (preg_match('/risk|volatil|drawdown|sharpe/', $question)) {
            $riskData = PerformanceRecord::with('portfolio')
                ->whereIn('period_type', [PerformanceRecord::PERIOD_MONTHLY, PerformanceRecord::PERIOD_DAILY])
                ->orderByDesc('date')
                ->limit(60)
                ->get();

            $avgVolatility = $riskData->avg('volatility');
            $avgSharpe = $riskData->avg('sharpe_ratio');
            $maxDD = $riskData->min('max_drawdown');

            return [
                'answer' => sprintf(
                    'Current risk metrics: Average volatility is %.2f%%, Sharpe ratio is %.2f, and maximum drawdown is %.2f%%. Risk levels are %s based on current market conditions.',
                    abs((float) $avgVolatility) * 100,
                    (float) $avgSharpe,
                    abs((float) $maxDD) * 100,
                    abs((float) $avgVolatility) > 0.02 ? 'elevated' : 'within normal range'
                ),
                'data_type' => 'risk',
                'data' => $riskData->groupBy('portfolio_id')->map(function ($records) {
                    $latest = $records->sortByDesc('date')->first();
                    return [
                        'portfolio' => $latest->portfolio->name ?? 'N/A',
                        'volatility' => round(abs((float) $latest->volatility) * 100, 2) . '%',
                        'sharpe_ratio' => round((float) $latest->sharpe_ratio, 2),
                        'max_drawdown' => round(abs((float) $latest->max_drawdown) * 100, 2) . '%',
                    ];
                })->values(),
                'chart_data' => $riskData->where('period_type', PerformanceRecord::PERIOD_DAILY)
                    ->sortBy('date')
                    ->map(fn($r) => [
                        'date' => $r->date?->toDateString(),
                        'volatility' => round(abs((float) $r->volatility) * 100, 2),
                        'sharpe' => round((float) $r->sharpe_ratio, 2),
                    ])->values(),
            ];
        }

        // Portfolio / allocation queries
        if (preg_match('/portfolio|allocation|allocat|fund|aum/', $question)) {
            $portfolios = Portfolio::with(['positions.asset'])->get();
            $totalAUM = $portfolios->sum('total_value');

            $allocation = Position::with('asset')
                ->whereNull('close_date')
                ->get()
                ->groupBy(fn($p) => $p->asset->asset_class ?? 'OTHER')
                ->map(fn($group, $class) => [
                    'asset_class' => $class,
                    'market_value' => round($group->sum('market_value'), 2),
                    'count' => $group->count(),
                ]);

            return [
                'answer' => sprintf(
                    'Total AUM across %d portfolios is $%s. The allocation is spread across %d asset classes. The largest allocation is %s at $%s.',
                    $portfolios->count(),
                    number_format((float) $totalAUM, 2),
                    $allocation->count(),
                    $allocation->sortByDesc('market_value')->keys()->first() ?? 'N/A',
                    number_format($allocation->sortByDesc('market_value')->first()['market_value'] ?? 0, 2)
                ),
                'data_type' => 'allocation',
                'data' => $portfolios->map(fn($p) => [
                    'name' => $p->name,
                    'total_value' => '$' . number_format((float) $p->total_value, 2),
                    'positions' => $p->positions->count(),
                    'currency' => $p->currency,
                ])->values(),
                'chart_data' => $allocation->map(fn($a) => [
                    'name' => $a['asset_class'],
                    'value' => $a['market_value'],
                ])->values(),
            ];
        }

        // Default: general summary
        $portfolioCount = Portfolio::count();
        $totalAUM = Portfolio::sum('total_value');
        $tradeCount = Trade::count();
        $partnerCount = Partner::where('is_active', true)->count();

        return [
            'answer' => sprintf(
                'MultiFund AI currently manages %d portfolios with total AUM of $%s. There are %d recorded trades and %d active partners. You can ask about performance, NAV, top holdings, risk metrics, or portfolio allocations for more specific insights.',
                $portfolioCount,
                number_format((float) $totalAUM, 2),
                $tradeCount,
                $partnerCount
            ),
            'data_type' => 'summary',
            'data' => [
                'portfolios' => $portfolioCount,
                'total_aum' => '$' . number_format((float) $totalAUM, 2),
                'trades' => $tradeCount,
                'active_partners' => $partnerCount,
            ],
            'chart_data' => null,
            'suggestions' => [
                'What is the current portfolio performance?',
                'Show me the latest NAV values',
                'What are the top holdings?',
                'What is the current risk level?',
                'Show me the portfolio allocation breakdown',
            ],
        ];
    }

    /**
     * Convert period string to number of days.
     */
    private function periodToDays(string $period): int
    {
        return match ($period) {
            '30d' => 30,
            '90d' => 90,
            '6m' => 180,
            '1y' => 365,
            default => 30,
        };
    }

    /**
     * Compute linear trend slope from a collection of values.
     */
    private function computeLinearTrendSlope($values): float
    {
        $n = $values->count();
        if ($n < 2) return 0;

        $sumX = 0;
        $sumY = 0;
        $sumXY = 0;
        $sumX2 = 0;

        foreach ($values as $i => $y) {
            $x = $i;
            $sumX += $x;
            $sumY += $y;
            $sumXY += $x * $y;
            $sumX2 += $x * $x;
        }

        $denominator = $n * $sumX2 - $sumX * $sumX;
        if ($denominator == 0) return 0;

        return ($n * $sumXY - $sumX * $sumY) / $denominator;
    }

    /**
     * Generate predicted NAV series using geometric Brownian motion approximation.
     */
    private function generatePredictedNavSeries(float $lastNav, float $avgReturn, float $volatility, int $days): array
    {
        $series = [];
        $nav = $lastNav;
        $step = max(1, (int) ceil($days / 60)); // max ~60 data points

        for ($d = 1; $d <= $days; $d += $step) {
            $tSqrt = sqrt($d);
            $predictedNav = round($lastNav * exp(($avgReturn - 0.5 * pow($volatility, 2)) * $d + 0), 2);
            $upperBound = round($lastNav * exp(($avgReturn + 1.96 * $volatility / sqrt(max($d, 1))) * $d), 2);
            $lowerBound = round($lastNav * exp(($avgReturn - 1.96 * $volatility / sqrt(max($d, 1))) * $d), 2);

            // More realistic: linear drift with widening confidence band
            $drift = $lastNav * $avgReturn * $d;
            $spread = $lastNav * $volatility * $tSqrt * 1.96;
            $predictedNav = round($lastNav + $drift, 2);
            $upperBound = round($predictedNav + $spread, 2);
            $lowerBound = round($predictedNav - $spread, 2);

            $series[] = [
                'date' => now()->addDays($d)->toDateString(),
                'predicted_nav' => $predictedNav,
                'upper_bound' => $upperBound,
                'lower_bound' => max(0, $lowerBound),
            ];
        }

        return $series;
    }

    /**
     * Generate market signals from return data and trends.
     */
    private function generateMarketSignals($returns, $navValues, float $trendSlope): array
    {
        $signals = [];

        // 1. Moving average crossover signal
        if ($navValues->count() >= 50) {
            $ma20 = $navValues->slice(-20)->avg();
            $ma50 = $navValues->slice(-50)->avg();
            $signals[] = [
                'indicator' => 'Moving Average Crossover (20/50)',
                'signal' => $ma20 > $ma50 ? 'BUY' : 'SELL',
                'strength' => round(abs($ma20 - $ma50) / max($ma50, 1) * 100, 2),
            ];
        }

        // 2. Momentum signal from returns
        if ($returns->count() >= 10) {
            $recent5 = $returns->take(5)->avg();
            $older5 = $returns->slice(5, 5)->avg();
            $momentum = $recent5 - $older5;
            $signals[] = [
                'indicator' => 'Return Momentum (5-day)',
                'signal' => $momentum > 0 ? 'BULLISH' : 'BEARISH',
                'strength' => round(abs($momentum) * 10000, 2),
            ];
        }

        // 3. Trend direction from linear regression
        $signals[] = [
            'indicator' => 'Linear Trend',
            'signal' => $trendSlope > 0 ? 'UPTREND' : ($trendSlope < 0 ? 'DOWNTREND' : 'FLAT'),
            'strength' => round(abs($trendSlope), 4),
        ];

        // 4. Volatility regime
        if ($returns->count() >= 20) {
            $recentVol = $this->computeStdDev($returns->take(10));
            $historicalVol = $this->computeStdDev($returns);
            $volRatio = $historicalVol > 0 ? $recentVol / $historicalVol : 1;
            $signals[] = [
                'indicator' => 'Volatility Regime',
                'signal' => $volRatio > 1.2 ? 'HIGH_VOLATILITY' : ($volRatio < 0.8 ? 'LOW_VOLATILITY' : 'NORMAL'),
                'strength' => round($volRatio * 100, 2),
            ];
        }

        // 5. RSI approximation
        if ($returns->count() >= 14) {
            $gains = $returns->take(14)->filter(fn($r) => $r > 0);
            $losses = $returns->take(14)->filter(fn($r) => $r < 0)->map(fn($r) => abs($r));
            $avgGain = $gains->count() > 0 ? $gains->avg() : 0.001;
            $avgLoss = $losses->count() > 0 ? $losses->avg() : 0.001;
            $rs = $avgLoss > 0 ? $avgGain / $avgLoss : 100;
            $rsi = round(100 - (100 / (1 + $rs)), 1);
            $signals[] = [
                'indicator' => 'RSI (14-period)',
                'signal' => $rsi > 70 ? 'OVERBOUGHT' : ($rsi < 30 ? 'OVERSOLD' : 'NEUTRAL'),
                'strength' => $rsi,
            ];
        }

        return $signals;
    }

    /**
     * Simulate processing a trade confirmation document.
     */
    private function processTradeConfirmation(?Trade $trade): array
    {
        $fields = [];
        $suggestedEntries = [];

        if ($trade) {
            $fields = [
                ['field' => 'Trade Number', 'value' => $trade->trade_number, 'confidence' => 0.99],
                ['field' => 'Trade Date', 'value' => $trade->trade_date?->toDateString(), 'confidence' => 0.98],
                ['field' => 'Settlement Date', 'value' => $trade->settlement_date?->toDateString(), 'confidence' => 0.97],
                ['field' => 'Security', 'value' => $trade->asset->name ?? 'N/A', 'confidence' => 0.96],
                ['field' => 'Symbol', 'value' => $trade->asset->symbol ?? 'N/A', 'confidence' => 0.99],
                ['field' => 'Trade Type', 'value' => $trade->trade_type, 'confidence' => 0.99],
                ['field' => 'Quantity', 'value' => number_format((float) $trade->quantity, 2), 'confidence' => 0.98],
                ['field' => 'Price', 'value' => '$' . number_format((float) $trade->price, 4), 'confidence' => 0.97],
                ['field' => 'Total Amount', 'value' => '$' . number_format((float) $trade->total_amount, 2), 'confidence' => 0.96],
                ['field' => 'Commission', 'value' => '$' . number_format((float) $trade->commission, 2), 'confidence' => 0.95],
                ['field' => 'Currency', 'value' => $trade->currency, 'confidence' => 0.99],
                ['field' => 'Portfolio', 'value' => $trade->portfolio->name ?? 'N/A', 'confidence' => 0.94],
            ];

            $isDebit = in_array($trade->trade_type, [Trade::TYPE_BUY, Trade::TYPE_COVER]);
            $suggestedEntries = [
                [
                    'account' => $isDebit ? 'Investment Securities' : 'Cash & Equivalents',
                    'debit' => $isDebit ? round((float) $trade->total_amount, 2) : 0,
                    'credit' => $isDebit ? 0 : round((float) $trade->total_amount, 2),
                    'description' => sprintf('%s %s %s @ $%s', $trade->trade_type, number_format((float) $trade->quantity, 0), $trade->asset->symbol ?? '', number_format((float) $trade->price, 2)),
                ],
                [
                    'account' => $isDebit ? 'Cash & Equivalents' : 'Investment Securities',
                    'debit' => $isDebit ? 0 : round((float) $trade->total_amount, 2),
                    'credit' => $isDebit ? round((float) $trade->total_amount, 2) : 0,
                    'description' => sprintf('Settlement - %s', $trade->trade_number),
                ],
                [
                    'account' => 'Trading Commissions & Fees',
                    'debit' => round((float) $trade->commission + (float) $trade->fees, 2),
                    'credit' => 0,
                    'description' => sprintf('Brokerage fees - %s', $trade->trade_number),
                ],
            ];
        }

        return [
            'document_type' => 'trade_confirmation',
            'processing_date' => now()->toIso8601String(),
            'extracted_fields' => $fields,
            'confidence_score' => $trade ? 0.97 : 0,
            'validation_status' => $trade ? 'VALID' : 'NO_DATA',
            'warnings' => $trade
                ? ($trade->status === Trade::STATUS_PENDING
                    ? ['Trade is still in PENDING status - confirm execution before booking']
                    : [])
                : ['No trade data available for processing'],
            'suggested_entries' => $suggestedEntries,
        ];
    }

    /**
     * Simulate processing an account statement document.
     */
    private function processStatement(?CapitalAccount $capitalAccount, ?Partner $partner): array
    {
        $fields = [];
        $suggestedEntries = [];

        if ($capitalAccount && $partner) {
            $fields = [
                ['field' => 'Partner Name', 'value' => $partner->name, 'confidence' => 0.96],
                ['field' => 'Account Type', 'value' => $partner->type, 'confidence' => 0.95],
                ['field' => 'Period Start', 'value' => $capitalAccount->period_start?->toDateString(), 'confidence' => 0.98],
                ['field' => 'Period End', 'value' => $capitalAccount->period_end?->toDateString(), 'confidence' => 0.98],
                ['field' => 'Beginning Balance', 'value' => '$' . number_format((float) $capitalAccount->beginning_balance, 2), 'confidence' => 0.97],
                ['field' => 'Contributions', 'value' => '$' . number_format((float) $capitalAccount->contributions, 2), 'confidence' => 0.96],
                ['field' => 'Withdrawals', 'value' => '$' . number_format((float) $capitalAccount->withdrawals, 2), 'confidence' => 0.96],
                ['field' => 'Income Allocation', 'value' => '$' . number_format((float) $capitalAccount->income_allocation, 2), 'confidence' => 0.94],
                ['field' => 'Management Fee', 'value' => '$' . number_format((float) $capitalAccount->management_fee, 2), 'confidence' => 0.95],
                ['field' => 'Performance Fee', 'value' => '$' . number_format((float) $capitalAccount->performance_fee, 2), 'confidence' => 0.94],
                ['field' => 'Ending Balance', 'value' => '$' . number_format((float) $capitalAccount->ending_balance, 2), 'confidence' => 0.97],
            ];

            $suggestedEntries = [
                [
                    'account' => 'Partner Capital - ' . $partner->name,
                    'debit' => 0,
                    'credit' => round((float) $capitalAccount->contributions, 2),
                    'description' => 'Capital contribution for period',
                ],
                [
                    'account' => 'Management Fee Income',
                    'debit' => 0,
                    'credit' => round((float) $capitalAccount->management_fee, 2),
                    'description' => 'Management fee allocation',
                ],
                [
                    'account' => 'Performance Fee Income',
                    'debit' => 0,
                    'credit' => round((float) $capitalAccount->performance_fee, 2),
                    'description' => 'Performance fee allocation',
                ],
            ];
        }

        $warnings = [];
        if ($capitalAccount) {
            $computed = (float) $capitalAccount->beginning_balance
                + (float) $capitalAccount->contributions
                - (float) $capitalAccount->withdrawals
                + (float) $capitalAccount->income_allocation
                - (float) $capitalAccount->expense_allocation
                + (float) $capitalAccount->gain_loss_allocation
                - (float) $capitalAccount->management_fee
                - (float) $capitalAccount->performance_fee;
            $diff = abs($computed - (float) $capitalAccount->ending_balance);
            if ($diff > 0.01) {
                $warnings[] = sprintf('Ending balance discrepancy of $%.2f detected - verify allocations', $diff);
            }
        }

        return [
            'document_type' => 'statement',
            'processing_date' => now()->toIso8601String(),
            'extracted_fields' => $fields,
            'confidence_score' => $capitalAccount ? 0.95 : 0,
            'validation_status' => $capitalAccount ? (empty($warnings) ? 'VALID' : 'WARNING') : 'NO_DATA',
            'warnings' => $capitalAccount ? $warnings : ['No statement data available for processing'],
            'suggested_entries' => $suggestedEntries,
        ];
    }

    /**
     * Simulate processing a K-1 tax document.
     */
    private function processK1(?Partner $partner, ?CapitalAccount $capitalAccount): array
    {
        $fields = [];
        $suggestedEntries = [];

        if ($partner && $capitalAccount) {
            $ordinaryIncome = round((float) $capitalAccount->income_allocation * 0.4, 2);
            $capitalGains = round((float) $capitalAccount->gain_loss_allocation, 2);
            $dividends = round((float) $capitalAccount->income_allocation * 0.2, 2);
            $interestIncome = round((float) $capitalAccount->income_allocation * 0.3, 2);
            $otherIncome = round((float) $capitalAccount->income_allocation * 0.1, 2);

            $fields = [
                ['field' => 'Partner Name', 'value' => $partner->name, 'confidence' => 0.97],
                ['field' => 'Tax ID', 'value' => $partner->tax_id ?? 'Not provided', 'confidence' => $partner->tax_id ? 0.96 : 0.0],
                ['field' => 'Partner Type', 'value' => $partner->type, 'confidence' => 0.98],
                ['field' => 'Ownership Percentage', 'value' => number_format((float) $partner->ownership_pct, 2) . '%', 'confidence' => 0.95],
                ['field' => 'Ordinary Income (Box 1)', 'value' => '$' . number_format($ordinaryIncome, 2), 'confidence' => 0.93],
                ['field' => 'Net Capital Gains (Box 9a)', 'value' => '$' . number_format($capitalGains, 2), 'confidence' => 0.92],
                ['field' => 'Qualified Dividends (Box 6b)', 'value' => '$' . number_format($dividends, 2), 'confidence' => 0.91],
                ['field' => 'Interest Income (Box 5)', 'value' => '$' . number_format($interestIncome, 2), 'confidence' => 0.92],
                ['field' => 'Other Income (Box 11)', 'value' => '$' . number_format($otherIncome, 2), 'confidence' => 0.90],
                ['field' => 'Beginning Capital', 'value' => '$' . number_format((float) $capitalAccount->beginning_balance, 2), 'confidence' => 0.96],
                ['field' => 'Ending Capital', 'value' => '$' . number_format((float) $capitalAccount->ending_balance, 2), 'confidence' => 0.96],
                ['field' => 'Tax Year', 'value' => $capitalAccount->period_end?->year ?? now()->year, 'confidence' => 0.99],
            ];

            $suggestedEntries = [
                [
                    'account' => 'Tax Allocation - Ordinary Income',
                    'debit' => $ordinaryIncome,
                    'credit' => 0,
                    'description' => sprintf('K-1 Box 1 - %s ordinary income allocation', $partner->name),
                ],
                [
                    'account' => 'Tax Allocation - Capital Gains',
                    'debit' => abs($capitalGains),
                    'credit' => 0,
                    'description' => sprintf('K-1 Box 9a - %s capital gains allocation', $partner->name),
                ],
                [
                    'account' => 'Tax Allocation - Dividends',
                    'debit' => $dividends,
                    'credit' => 0,
                    'description' => sprintf('K-1 Box 6b - %s qualified dividends', $partner->name),
                ],
            ];
        }

        $warnings = [];
        if ($partner && !$partner->tax_id) {
            $warnings[] = 'Missing Tax ID for partner - required for K-1 filing';
        }

        return [
            'document_type' => 'k1',
            'processing_date' => now()->toIso8601String(),
            'extracted_fields' => $fields,
            'confidence_score' => ($partner && $capitalAccount) ? 0.93 : 0,
            'validation_status' => ($partner && $capitalAccount) ? (empty($warnings) ? 'VALID' : 'WARNING') : 'NO_DATA',
            'warnings' => ($partner && $capitalAccount) ? $warnings : ['No partner/capital account data available for K-1 processing'],
            'suggested_entries' => $suggestedEntries,
        ];
    }

    /**
     * Generate recent AI insights from portfolio data.
     */
    private function generateRecentInsights($portfolios): array
    {
        $insights = [];

        // Performance-based insights
        foreach ($portfolios as $portfolio) {
            $latestPerf = $portfolio->performanceRecords->first();
            if (!$latestPerf) continue;

            $totalReturn = (float) $latestPerf->total_return;
            $alpha = (float) $latestPerf->alpha_return;

            if ($alpha > 0.01) {
                $insights[] = [
                    'type' => 'OUTPERFORMANCE',
                    'severity' => 'info',
                    'portfolio' => $portfolio->name,
                    'message' => sprintf('%s is outperforming its benchmark by %.2f%% alpha', $portfolio->name, $alpha * 100),
                    'date' => $latestPerf->date?->toDateString() ?? now()->toDateString(),
                ];
            } elseif ($alpha < -0.02) {
                $insights[] = [
                    'type' => 'UNDERPERFORMANCE',
                    'severity' => 'warning',
                    'portfolio' => $portfolio->name,
                    'message' => sprintf('%s is underperforming benchmark by %.2f%% - review allocation strategy', $portfolio->name, abs($alpha) * 100),
                    'date' => $latestPerf->date?->toDateString() ?? now()->toDateString(),
                ];
            }

            if (abs((float) $latestPerf->max_drawdown) > 0.1) {
                $insights[] = [
                    'type' => 'DRAWDOWN_ALERT',
                    'severity' => 'warning',
                    'portfolio' => $portfolio->name,
                    'message' => sprintf('Maximum drawdown of %.1f%% detected in %s - monitor closely', abs((float) $latestPerf->max_drawdown) * 100, $portfolio->name),
                    'date' => $latestPerf->date?->toDateString() ?? now()->toDateString(),
                ];
            }
        }

        // Trade volume insight
        $recentTradeCount = Trade::where('trade_date', '>=', now()->subDays(7))->count();
        if ($recentTradeCount > 0) {
            $insights[] = [
                'type' => 'TRADE_ACTIVITY',
                'severity' => 'info',
                'portfolio' => 'All',
                'message' => sprintf('%d trades executed in the last 7 days', $recentTradeCount),
                'date' => now()->toDateString(),
            ];
        }

        // Stale pricing insight
        $staleAssetCount = Asset::where('is_active', true)
            ->whereNotNull('price_date')
            ->where('price_date', '<', now()->subDays(5))
            ->count();
        if ($staleAssetCount > 0) {
            $insights[] = [
                'type' => 'STALE_PRICING',
                'severity' => 'warning',
                'portfolio' => 'All',
                'message' => sprintf('%d assets have stale pricing (>5 days old) - update price feeds', $staleAssetCount),
                'date' => now()->toDateString(),
            ];
        }

        return array_slice($insights, 0, 15);
    }
}
