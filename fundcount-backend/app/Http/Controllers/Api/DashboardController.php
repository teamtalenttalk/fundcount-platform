<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NAVHistory;
use App\Models\Partner;
use App\Models\PerformanceRecord;
use App\Models\Portfolio;
use App\Models\Position;
use App\Models\Trade;

class DashboardController extends Controller
{
    public function index()
    {
        $totalAUM = Portfolio::sum('total_value');
        $totalPortfolios = Portfolio::count();
        $activePartners = Partner::where('is_active', true)->count();

        // MTD return: average total_return from this month's performance records
        $mtdReturn = PerformanceRecord::where('period_type', 'MONTHLY')
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->avg('total_return') ?? 0;

        // NAV history: last 30 days for first portfolio
        $firstPortfolio = Portfolio::first();
        $navHistory = $firstPortfolio
            ? NAVHistory::where('portfolio_id', $firstPortfolio->id)
                ->orderByDesc('date')
                ->limit(30)
                ->get()
                ->sortBy('date')
                ->values()
            : [];

        // Asset allocation: positions grouped by asset class
        $assetAllocation = Position::with('asset')
            ->get()
            ->groupBy(fn($p) => $p->asset->asset_class ?? 'OTHER')
            ->map(fn($positions, $class) => [
                'asset_class' => $class,
                'market_value' => $positions->sum('market_value'),
                'count' => $positions->count(),
            ])
            ->values();

        // Recent trades
        $recentTrades = Trade::with(['portfolio', 'asset'])
            ->orderByDesc('trade_date')
            ->limit(10)
            ->get();

        // Portfolio performance: latest performance record per portfolio
        $portfolioPerformance = Portfolio::with(['performanceRecords' => function ($q) {
            $q->orderByDesc('date')->limit(1);
        }])->get()->map(function ($portfolio) {
            $latest = $portfolio->performanceRecords->first();
            return [
                'portfolio_id' => $portfolio->id,
                'portfolio_name' => $portfolio->name,
                'total_value' => $portfolio->total_value,
                'total_return' => $latest?->total_return ?? 0,
                'benchmark_return' => $latest?->benchmark_return ?? 0,
                'alpha_return' => $latest?->alpha_return ?? 0,
                'sharpe_ratio' => $latest?->sharpe_ratio ?? 0,
            ];
        });

        return response()->json([
            'totalAUM' => $totalAUM,
            'totalPortfolios' => $totalPortfolios,
            'activePartners' => $activePartners,
            'mtdReturn' => $mtdReturn,
            'navHistory' => $navHistory,
            'assetAllocation' => $assetAllocation,
            'recentTrades' => $recentTrades,
            'portfolioPerformance' => $portfolioPerformance,
        ]);
    }
}
