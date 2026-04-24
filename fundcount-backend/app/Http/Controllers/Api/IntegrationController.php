<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Partner;
use App\Models\Portfolio;
use App\Models\Position;
use App\Models\Trade;
use App\Models\NAVHistory;
use App\Models\CapitalAccount;
use App\Models\InvestorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntegrationController extends Controller
{
    public function marketData(): JsonResponse
    {
        $assets = Asset::all();
        $positions = Position::with('asset')->where('portfolio_id', 1)->get();

        $exchanges = [
            ['name' => 'NYSE', 'status' => 'CONNECTED', 'latency_ms' => rand(2, 8), 'instruments' => 4521, 'last_update' => now()->subSeconds(rand(1, 30))->toIso8601String()],
            ['name' => 'NASDAQ', 'status' => 'CONNECTED', 'latency_ms' => rand(3, 12), 'instruments' => 3892, 'last_update' => now()->subSeconds(rand(1, 60))->toIso8601String()],
            ['name' => 'LSE', 'status' => 'CONNECTED', 'latency_ms' => rand(45, 120), 'instruments' => 2103, 'last_update' => now()->subMinutes(rand(1, 5))->toIso8601String()],
            ['name' => 'TSE', 'status' => 'DEGRADED', 'latency_ms' => rand(200, 400), 'instruments' => 1847, 'last_update' => now()->subMinutes(rand(10, 30))->toIso8601String()],
            ['name' => 'HKEX', 'status' => 'DISCONNECTED', 'latency_ms' => 0, 'instruments' => 1562, 'last_update' => now()->subHours(2)->toIso8601String()],
        ];

        $feeds = [];
        foreach ($assets as $asset) {
            $change = round((rand(-500, 500) / 100), 2);
            $feeds[] = [
                'symbol' => $asset->symbol,
                'name' => $asset->name,
                'asset_class' => $asset->asset_class,
                'price' => round($asset->current_price, 2),
                'change_pct' => $change,
                'bid' => round($asset->current_price * (1 - rand(1, 10) / 10000), 2),
                'ask' => round($asset->current_price * (1 + rand(1, 10) / 10000), 2),
                'volume' => rand(100000, 5000000),
                'source' => collect(['Bloomberg', 'Reuters', 'ICE', 'Refinitiv'])->random(),
                'quality' => $change > -3 ? 'GOOD' : 'STALE',
                'last_update' => now()->subSeconds(rand(1, 120))->toIso8601String(),
            ];
        }

        $quality_metrics = [
            'total_instruments' => $assets->count(),
            'good_quality' => collect($feeds)->where('quality', 'GOOD')->count(),
            'stale' => collect($feeds)->where('quality', 'STALE')->count(),
            'missing' => 0,
            'avg_latency_ms' => round(collect($exchanges)->where('status', 'CONNECTED')->avg('latency_ms'), 1),
            'uptime_pct' => 99.7,
            'last_health_check' => now()->toIso8601String(),
        ];

        return response()->json([
            'exchanges' => $exchanges,
            'feeds' => $feeds,
            'quality_metrics' => $quality_metrics,
        ]);
    }

    public function custodian(): JsonResponse
    {
        $portfolios = Portfolio::all();
        $totalPositions = Position::count();
        $totalAssets = Position::sum('market_value');

        $custodians = [
            [
                'id' => 1,
                'name' => 'State Street Global',
                'type' => 'Prime Custodian',
                'status' => 'ACTIVE',
                'accounts' => 3,
                'aum' => round($totalAssets * 0.55, 2),
                'positions' => (int) round($totalPositions * 0.6),
                'last_reconciled' => now()->subHours(2)->toIso8601String(),
                'reconciliation_status' => 'MATCHED',
                'connection_type' => 'SWIFT MT535/MT536',
            ],
            [
                'id' => 2,
                'name' => 'BNY Mellon',
                'type' => 'Sub-Custodian',
                'status' => 'ACTIVE',
                'accounts' => 2,
                'aum' => round($totalAssets * 0.30, 2),
                'positions' => (int) round($totalPositions * 0.25),
                'last_reconciled' => now()->subHours(6)->toIso8601String(),
                'reconciliation_status' => 'BREAK',
                'connection_type' => 'FTP/CSV',
            ],
            [
                'id' => 3,
                'name' => 'Northern Trust',
                'type' => 'Fund Administrator',
                'status' => 'PENDING',
                'accounts' => 1,
                'aum' => round($totalAssets * 0.15, 2),
                'positions' => (int) round($totalPositions * 0.15),
                'last_reconciled' => now()->subDays(1)->toIso8601String(),
                'reconciliation_status' => 'PENDING',
                'connection_type' => 'API/REST',
            ],
        ];

        $reconciliation_summary = [
            'total_positions' => $totalPositions,
            'matched' => (int) round($totalPositions * 0.78),
            'breaks' => (int) round($totalPositions * 0.11),
            'pending' => (int) round($totalPositions * 0.11),
            'last_full_recon' => now()->subHours(2)->toIso8601String(),
            'next_scheduled' => now()->addHours(4)->toIso8601String(),
        ];

        $recent_transactions = [];
        $txnTypes = ['SETTLEMENT', 'CORPORATE_ACTION', 'DIVIDEND', 'CASH_TRANSFER', 'FX_TRADE'];
        $statuses = ['COMPLETED', 'PENDING', 'FAILED'];
        $assets = Asset::take(6)->get();
        for ($i = 0; $i < 8; $i++) {
            $asset = $assets->random();
            $recent_transactions[] = [
                'id' => 'TXN-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                'type' => $txnTypes[array_rand($txnTypes)],
                'asset' => $asset->symbol,
                'custodian' => $custodians[rand(0, 1)]['name'],
                'amount' => round(rand(10000, 500000) + rand(0, 99) / 100, 2),
                'status' => $statuses[array_rand($statuses)],
                'date' => now()->subDays(rand(0, 5))->format('Y-m-d'),
            ];
        }

        return response()->json([
            'custodians' => $custodians,
            'reconciliation_summary' => $reconciliation_summary,
            'recent_transactions' => $recent_transactions,
            'total_aum' => round($totalAssets, 2),
        ]);
    }

    public function oms(): JsonResponse
    {
        $trades = Trade::with(['portfolio', 'asset'])->orderBy('trade_date', 'desc')->get();
        $assets = Asset::all();

        $orders = [];
        $orderStatuses = ['FILLED', 'PARTIALLY_FILLED', 'PENDING', 'CANCELLED', 'REJECTED'];
        $orderTypes = ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'];
        $brokers = ['Goldman Sachs', 'Morgan Stanley', 'JP Morgan', 'Citadel Securities', 'Virtu Financial'];

        foreach ($trades as $idx => $trade) {
            $status = $idx < 3 ? 'FILLED' : $orderStatuses[array_rand($orderStatuses)];
            $fillPct = $status === 'FILLED' ? 100 : ($status === 'PARTIALLY_FILLED' ? rand(20, 80) : ($status === 'PENDING' ? 0 : 0));
            $orders[] = [
                'order_id' => 'ORD-' . str_pad($idx + 1, 5, '0', STR_PAD_LEFT),
                'symbol' => $trade->asset->symbol ?? 'N/A',
                'asset_name' => $trade->asset->name ?? 'Unknown',
                'side' => $trade->trade_type ?? (rand(0, 1) ? 'BUY' : 'SELL'),
                'order_type' => $orderTypes[array_rand($orderTypes)],
                'quantity' => (int) abs($trade->quantity),
                'price' => round($trade->price, 2),
                'filled_qty' => (int) round(abs($trade->quantity) * $fillPct / 100),
                'fill_pct' => $fillPct,
                'status' => $status,
                'broker' => $brokers[array_rand($brokers)],
                'portfolio' => $trade->portfolio->name ?? 'Main Fund',
                'created_at' => $trade->trade_date,
                'filled_at' => $status === 'FILLED' ? $trade->settlement_date : null,
            ];
        }

        for ($i = count($orders); $i < 12; $i++) {
            $asset = $assets->random();
            $status = $orderStatuses[array_rand($orderStatuses)];
            $qty = rand(500, 20000);
            $fillPct = $status === 'FILLED' ? 100 : ($status === 'PARTIALLY_FILLED' ? rand(20, 80) : 0);
            $orders[] = [
                'order_id' => 'ORD-' . str_pad($i + 1, 5, '0', STR_PAD_LEFT),
                'symbol' => $asset->symbol,
                'asset_name' => $asset->name,
                'side' => rand(0, 1) ? 'BUY' : 'SELL',
                'order_type' => $orderTypes[array_rand($orderTypes)],
                'quantity' => $qty,
                'price' => round($asset->current_price * (1 + rand(-200, 200) / 10000), 2),
                'filled_qty' => (int) round($qty * $fillPct / 100),
                'fill_pct' => $fillPct,
                'status' => $status,
                'broker' => $brokers[array_rand($brokers)],
                'portfolio' => 'FundCount Main Fund',
                'created_at' => now()->subDays(rand(0, 10))->format('Y-m-d'),
                'filled_at' => $status === 'FILLED' ? now()->subDays(rand(0, 8))->format('Y-m-d') : null,
            ];
        }

        $summary = [
            'total_orders' => count($orders),
            'filled' => collect($orders)->where('status', 'FILLED')->count(),
            'partially_filled' => collect($orders)->where('status', 'PARTIALLY_FILLED')->count(),
            'pending' => collect($orders)->where('status', 'PENDING')->count(),
            'cancelled' => collect($orders)->where('status', 'CANCELLED')->count(),
            'rejected' => collect($orders)->where('status', 'REJECTED')->count(),
            'total_notional' => round(collect($orders)->sum(fn($o) => $o['quantity'] * $o['price']), 2),
            'fill_rate' => round(collect($orders)->where('status', 'FILLED')->count() / max(count($orders), 1) * 100, 1),
        ];

        $rebalancing = [];
        $positions = Position::with('asset')->where('portfolio_id', 1)->get();
        $totalMv = $positions->sum('market_value');
        foreach ($positions->take(6) as $pos) {
            $currentWeight = $totalMv > 0 ? round($pos->market_value / $totalMv * 100, 2) : 0;
            $targetWeight = round($currentWeight + rand(-300, 300) / 100, 2);
            $drift = round($currentWeight - $targetWeight, 2);
            $rebalancing[] = [
                'symbol' => $pos->asset->symbol,
                'asset_name' => $pos->asset->name,
                'current_weight' => $currentWeight,
                'target_weight' => max(0, $targetWeight),
                'drift' => $drift,
                'action' => $drift > 1 ? 'SELL' : ($drift < -1 ? 'BUY' : 'HOLD'),
                'estimated_quantity' => abs((int) round($pos->quantity * abs($drift) / 100)),
                'estimated_value' => round(abs($pos->market_value * $drift / 100), 2),
            ];
        }

        return response()->json([
            'orders' => $orders,
            'summary' => $summary,
            'rebalancing' => $rebalancing,
        ]);
    }

    public function omsCreateOrder(Request $request): JsonResponse
    {
        return response()->json([
            'order_id' => 'ORD-' . str_pad(rand(100, 999), 5, '0', STR_PAD_LEFT),
            'status' => 'PENDING',
            'message' => 'Order submitted successfully',
            'created_at' => now()->toIso8601String(),
        ]);
    }

    public function investorPortal(): JsonResponse
    {
        $partners = Partner::all();
        $portfolios = Portfolio::all();
        $navHistory = NAVHistory::orderBy('nav_date', 'desc')->take(30)->get();
        $totalAum = Position::sum('market_value');

        $investors = [];
        foreach ($partners as $partner) {
            $capitalBalance = round($partner->commitment_amount * (1 + rand(-500, 1500) / 10000), 2);
            $investors[] = [
                'id' => $partner->id,
                'name' => $partner->name,
                'type' => $partner->type,
                'commitment' => round($partner->commitment_amount, 2),
                'contributed' => round($partner->commitment_amount * rand(70, 100) / 100, 2),
                'distributions' => round($partner->commitment_amount * rand(5, 25) / 100, 2),
                'nav_share' => round($capitalBalance, 2),
                'ownership_pct' => round($partner->ownership_pct, 2),
                'irr' => round(rand(500, 1800) / 100, 2),
                'inception_date' => now()->subYears(rand(1, 5))->format('Y-m-d'),
                'status' => 'ACTIVE',
            ];
        }

        $capital_activity = [];
        $activityTypes = ['CAPITAL_CALL', 'DISTRIBUTION', 'REDEMPTION', 'SUBSCRIPTION'];
        for ($i = 0; $i < 10; $i++) {
            $type = $activityTypes[array_rand($activityTypes)];
            $partner = $partners->random();
            $capital_activity[] = [
                'id' => 'CA-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                'type' => $type,
                'investor' => $partner->name,
                'amount' => round(rand(100000, 5000000) + rand(0, 99) / 100, 2),
                'status' => collect(['COMPLETED', 'PENDING', 'SCHEDULED'])->random(),
                'date' => now()->subDays(rand(0, 60))->format('Y-m-d'),
                'due_date' => $type === 'CAPITAL_CALL' ? now()->addDays(rand(5, 30))->format('Y-m-d') : null,
                'notice_sent' => (bool) rand(0, 1),
            ];
        }

        $communications = [
            ['id' => 1, 'subject' => 'Q4 2025 Quarterly Report', 'type' => 'QUARTERLY_REPORT', 'date' => now()->subDays(15)->format('Y-m-d'), 'recipients' => count($investors), 'status' => 'SENT', 'open_rate' => rand(60, 95)],
            ['id' => 2, 'subject' => 'Capital Call Notice - Series A', 'type' => 'CAPITAL_CALL', 'date' => now()->subDays(8)->format('Y-m-d'), 'recipients' => 3, 'status' => 'SENT', 'open_rate' => 100],
            ['id' => 3, 'subject' => 'Annual K-1 Tax Documents', 'type' => 'TAX_DOCUMENT', 'date' => now()->subDays(30)->format('Y-m-d'), 'recipients' => count($investors), 'status' => 'SENT', 'open_rate' => rand(70, 90)],
            ['id' => 4, 'subject' => 'Fund Performance Update - March', 'type' => 'PERFORMANCE_UPDATE', 'date' => now()->subDays(3)->format('Y-m-d'), 'recipients' => count($investors), 'status' => 'DRAFT', 'open_rate' => 0],
        ];

        $portal_summary = [
            'total_investors' => count($investors),
            'total_aum' => round($totalAum, 2),
            'total_commitments' => round($partners->sum('commitment_amount'), 2),
            'pending_requests' => rand(1, 4),
            'unread_messages' => rand(0, 8),
            'upcoming_capital_calls' => collect($capital_activity)->where('type', 'CAPITAL_CALL')->where('status', 'SCHEDULED')->count(),
        ];

        return response()->json([
            'investors' => $investors,
            'capital_activity' => $capital_activity,
            'communications' => $communications,
            'portal_summary' => $portal_summary,
        ]);
    }

    public function multiFund(): JsonResponse
    {
        $portfolios = Portfolio::all();
        $totalAum = Position::sum('market_value');

        $funds = [];
        $structures = ['STANDALONE', 'MASTER', 'FEEDER', 'SIDE_POCKET'];
        $fundNames = [
            ['name' => 'MultiFund AI Master Fund', 'structure' => 'MASTER', 'strategy' => 'Multi-Strategy'],
            ['name' => 'MultiFund AI Equity Feeder', 'structure' => 'FEEDER', 'strategy' => 'Long/Short Equity', 'parent' => 'MultiFund AI Master Fund'],
            ['name' => 'MultiFund AI Fixed Income Feeder', 'structure' => 'FEEDER', 'strategy' => 'Credit/Rates', 'parent' => 'MultiFund AI Master Fund'],
            ['name' => 'MultiFund AI Opportunities SP', 'structure' => 'SIDE_POCKET', 'strategy' => 'Illiquid/Special Situations', 'parent' => 'MultiFund AI Master Fund'],
            ['name' => 'MultiFund AI Fund of Funds', 'structure' => 'STANDALONE', 'strategy' => 'Fund of Funds'],
        ];

        $masterNav = round($totalAum * 1.2, 2);
        foreach ($fundNames as $idx => $fn) {
            $nav = $idx === 0 ? $masterNav : round($masterNav * rand(10, 35) / 100, 2);
            $mtdReturn = round(rand(-200, 500) / 100, 2);
            $ytdReturn = round(rand(-500, 1500) / 100, 2);
            $fund = [
                'id' => $idx + 1,
                'name' => $fn['name'],
                'structure' => $fn['structure'],
                'strategy' => $fn['strategy'],
                'nav' => $nav,
                'nav_per_share' => round($nav / rand(800000, 1200000), 2),
                'mtd_return' => $mtdReturn,
                'ytd_return' => $ytdReturn,
                'inception_return' => round($ytdReturn * rand(150, 300) / 100, 2),
                'aum' => $nav,
                'investors' => rand(3, 25),
                'status' => 'ACTIVE',
                'base_currency' => 'USD',
                'inception_date' => now()->subYears(rand(1, 5))->format('Y-m-d'),
            ];
            if (isset($fn['parent'])) {
                $fund['parent_fund'] = $fn['parent'];
            }
            $funds[] = $fund;
        }

        $series_classes = [
            ['fund' => 'MultiFund AI Master Fund', 'series' => 'Class A', 'mgmt_fee' => 1.50, 'perf_fee' => 20.0, 'nav_per_share' => round(rand(100, 150) + rand(0, 99) / 100, 2), 'min_investment' => 1000000, 'lock_up' => '1 year', 'investors' => 8],
            ['fund' => 'MultiFund AI Master Fund', 'series' => 'Class B', 'mgmt_fee' => 1.00, 'perf_fee' => 15.0, 'nav_per_share' => round(rand(100, 150) + rand(0, 99) / 100, 2), 'min_investment' => 5000000, 'lock_up' => '2 years', 'investors' => 3],
            ['fund' => 'MultiFund AI Master Fund', 'series' => 'Class I', 'mgmt_fee' => 0.75, 'perf_fee' => 10.0, 'nav_per_share' => round(rand(100, 150) + rand(0, 99) / 100, 2), 'min_investment' => 25000000, 'lock_up' => '3 years', 'investors' => 2],
            ['fund' => 'MultiFund AI Equity Feeder', 'series' => 'Class A', 'mgmt_fee' => 2.00, 'perf_fee' => 20.0, 'nav_per_share' => round(rand(80, 120) + rand(0, 99) / 100, 2), 'min_investment' => 500000, 'lock_up' => '6 months', 'investors' => 12],
        ];

        $look_through = [];
        $assetClasses = ['US Equity', 'International Equity', 'Fixed Income', 'Alternatives', 'Cash', 'Real Estate'];
        $remaining = 100;
        foreach ($assetClasses as $idx => $ac) {
            $alloc = $idx < count($assetClasses) - 1 ? rand(5, min(35, $remaining - (count($assetClasses) - $idx - 1) * 3)) : $remaining;
            $remaining -= $alloc;
            $look_through[] = [
                'asset_class' => $ac,
                'allocation_pct' => (float) $alloc,
                'market_value' => round($masterNav * $alloc / 100, 2),
                'positions' => rand(3, 25),
            ];
        }

        $cross_fund_exposure = [
            ['sector' => 'Technology', 'master_pct' => 28.5, 'equity_feeder_pct' => 42.1, 'fi_feeder_pct' => 5.2, 'total_value' => round($masterNav * 0.285, 2)],
            ['sector' => 'Healthcare', 'master_pct' => 15.2, 'equity_feeder_pct' => 18.7, 'fi_feeder_pct' => 8.3, 'total_value' => round($masterNav * 0.152, 2)],
            ['sector' => 'Financial Services', 'master_pct' => 19.8, 'equity_feeder_pct' => 12.4, 'fi_feeder_pct' => 32.1, 'total_value' => round($masterNav * 0.198, 2)],
            ['sector' => 'Energy', 'master_pct' => 8.3, 'equity_feeder_pct' => 6.5, 'fi_feeder_pct' => 12.8, 'total_value' => round($masterNav * 0.083, 2)],
            ['sector' => 'Consumer', 'master_pct' => 12.1, 'equity_feeder_pct' => 14.3, 'fi_feeder_pct' => 9.6, 'total_value' => round($masterNav * 0.121, 2)],
        ];

        $consolidation_summary = [
            'total_funds' => count($funds),
            'master_funds' => collect($funds)->where('structure', 'MASTER')->count(),
            'feeder_funds' => collect($funds)->where('structure', 'FEEDER')->count(),
            'side_pockets' => collect($funds)->where('structure', 'SIDE_POCKET')->count(),
            'total_aum' => round(collect($funds)->sum('nav'), 2),
            'total_investors' => collect($funds)->sum('investors'),
            'total_series' => count($series_classes),
        ];

        return response()->json([
            'funds' => $funds,
            'series_classes' => $series_classes,
            'look_through' => $look_through,
            'cross_fund_exposure' => $cross_fund_exposure,
            'consolidation_summary' => $consolidation_summary,
        ]);
    }

    public function apiGateway(): JsonResponse
    {
        $endpoints = [
            ['method' => 'GET', 'path' => '/api/v1/portfolios', 'description' => 'List all portfolios', 'category' => 'Portfolio', 'rate_limit' => '100/min', 'avg_response_ms' => rand(20, 80)],
            ['method' => 'GET', 'path' => '/api/v1/portfolios/{id}', 'description' => 'Get portfolio details', 'category' => 'Portfolio', 'rate_limit' => '100/min', 'avg_response_ms' => rand(15, 50)],
            ['method' => 'GET', 'path' => '/api/v1/positions', 'description' => 'List positions across portfolios', 'category' => 'Portfolio', 'rate_limit' => '100/min', 'avg_response_ms' => rand(30, 90)],
            ['method' => 'POST', 'path' => '/api/v1/trades', 'description' => 'Submit a new trade order', 'category' => 'Trading', 'rate_limit' => '50/min', 'avg_response_ms' => rand(50, 150)],
            ['method' => 'GET', 'path' => '/api/v1/nav/{portfolio_id}', 'description' => 'Get current NAV calculation', 'category' => 'NAV', 'rate_limit' => '60/min', 'avg_response_ms' => rand(100, 300)],
            ['method' => 'GET', 'path' => '/api/v1/nav/history', 'description' => 'Historical NAV time series', 'category' => 'NAV', 'rate_limit' => '60/min', 'avg_response_ms' => rand(40, 120)],
            ['method' => 'GET', 'path' => '/api/v1/compliance/status', 'description' => 'Compliance score and test results', 'category' => 'Compliance', 'rate_limit' => '30/min', 'avg_response_ms' => rand(200, 500)],
            ['method' => 'POST', 'path' => '/api/v1/compliance/check', 'description' => 'Run regulatory compliance check', 'category' => 'Compliance', 'rate_limit' => '10/min', 'avg_response_ms' => rand(300, 800)],
            ['method' => 'GET', 'path' => '/api/v1/investors', 'description' => 'List all investor profiles', 'category' => 'Investor', 'rate_limit' => '60/min', 'avg_response_ms' => rand(25, 70)],
            ['method' => 'POST', 'path' => '/api/v1/reports/generate', 'description' => 'Generate a fund report', 'category' => 'Reports', 'rate_limit' => '5/min', 'avg_response_ms' => rand(500, 2000)],
            ['method' => 'GET', 'path' => '/api/v1/market-data/{symbol}', 'description' => 'Real-time market data for symbol', 'category' => 'Market Data', 'rate_limit' => '200/min', 'avg_response_ms' => rand(5, 30)],
            ['method' => 'POST', 'path' => '/api/v1/webhooks', 'description' => 'Register a webhook endpoint', 'category' => 'Webhooks', 'rate_limit' => '10/min', 'avg_response_ms' => rand(30, 80)],
        ];

        $webhooks = [
            ['id' => 1, 'url' => 'https://client-app.example.com/hooks/nav', 'events' => ['nav.calculated', 'nav.published'], 'status' => 'ACTIVE', 'last_triggered' => now()->subHours(1)->toIso8601String(), 'success_rate' => 98.5],
            ['id' => 2, 'url' => 'https://risk.example.com/alerts', 'events' => ['compliance.breach', 'risk.threshold'], 'status' => 'ACTIVE', 'last_triggered' => now()->subHours(6)->toIso8601String(), 'success_rate' => 100.0],
            ['id' => 3, 'url' => 'https://ops.example.com/trades', 'events' => ['trade.executed', 'trade.settled'], 'status' => 'PAUSED', 'last_triggered' => now()->subDays(2)->toIso8601String(), 'success_rate' => 92.3],
        ];

        $api_keys = [
            ['id' => 1, 'name' => 'Production App', 'prefix' => 'mfai_prod_****7x9k', 'permissions' => ['read', 'write', 'trade'], 'created' => now()->subMonths(3)->format('Y-m-d'), 'last_used' => now()->subMinutes(15)->toIso8601String(), 'status' => 'ACTIVE', 'requests_today' => rand(500, 2000)],
            ['id' => 2, 'name' => 'Reporting Service', 'prefix' => 'mfai_prod_****3m2p', 'permissions' => ['read'], 'created' => now()->subMonths(1)->format('Y-m-d'), 'last_used' => now()->subHours(2)->toIso8601String(), 'status' => 'ACTIVE', 'requests_today' => rand(100, 400)],
            ['id' => 3, 'name' => 'Sandbox Testing', 'prefix' => 'mfai_test_****8n4q', 'permissions' => ['read', 'write', 'trade'], 'created' => now()->subWeeks(2)->format('Y-m-d'), 'last_used' => now()->subDays(1)->toIso8601String(), 'status' => 'ACTIVE', 'requests_today' => rand(10, 80)],
        ];

        $days = [];
        for ($i = 29; $i >= 0; $i--) {
            $days[] = [
                'date' => now()->subDays($i)->format('Y-m-d'),
                'requests' => rand(2000, 8000),
                'errors' => rand(0, 50),
                'avg_latency_ms' => rand(40, 150),
            ];
        }

        $usage = [
            'daily_stats' => $days,
            'total_requests_today' => collect($api_keys)->sum('requests_today'),
            'total_requests_month' => rand(80000, 200000),
            'error_rate' => round(rand(5, 30) / 10, 1),
            'avg_latency_ms' => round(collect($endpoints)->avg('avg_response_ms'), 1),
            'uptime_pct' => 99.95,
        ];

        return response()->json([
            'endpoints' => $endpoints,
            'webhooks' => $webhooks,
            'api_keys' => $api_keys,
            'usage' => $usage,
        ]);
    }
}
