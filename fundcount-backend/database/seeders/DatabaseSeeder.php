<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Asset;
use App\Models\Benchmark;
use App\Models\CapitalAccount;
use App\Models\Currency;
use App\Models\FiscalPeriod;
use App\Models\InvestorProfile;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\NAVHistory;
use App\Models\Partner;
use App\Models\PartnerAllocation;
use App\Models\PerformanceRecord;
use App\Models\Portfolio;
use App\Models\Position;
use App\Models\Setting;
use App\Models\Trade;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Users ──────────────────────────────────────────────
        $admin = User::create([
            'name' => 'System Administrator',
            'email' => 'admin@fundcount.com',
            'password' => 'admin123',
            'role' => 'ADMIN',
            'company' => 'FundCount Capital',
            'is_active' => true,
        ]);

        $manager = User::create([
            'name' => 'Portfolio Manager',
            'email' => 'manager@fundcount.com',
            'password' => 'manager123',
            'role' => 'MANAGER',
            'company' => 'FundCount Capital',
            'is_active' => true,
        ]);

        $analyst = User::create([
            'name' => 'Research Analyst',
            'email' => 'analyst@fundcount.com',
            'password' => 'analyst123',
            'role' => 'ANALYST',
            'company' => 'FundCount Capital',
            'is_active' => true,
        ]);

        $investor = User::create([
            'name' => 'James Williams',
            'email' => 'investor@fundcount.com',
            'password' => 'investor123',
            'role' => 'INVESTOR',
            'company' => 'Williams Family Office',
            'is_active' => true,
        ]);

        // ── Currencies ────────────────────────────────────────
        $currencies = [
            ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'exchange_rate' => 1.000000, 'is_base' => true],
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => "\xe2\x82\xac", 'exchange_rate' => 0.921500, 'is_base' => false],
            ['code' => 'GBP', 'name' => 'British Pound', 'symbol' => "\xc2\xa3", 'exchange_rate' => 0.792300, 'is_base' => false],
            ['code' => 'JPY', 'name' => 'Japanese Yen', 'symbol' => "\xc2\xa5", 'exchange_rate' => 154.850000, 'is_base' => false],
            ['code' => 'CHF', 'name' => 'Swiss Franc', 'symbol' => 'CHF', 'exchange_rate' => 0.881200, 'is_base' => false],
            ['code' => 'CAD', 'name' => 'Canadian Dollar', 'symbol' => 'C$', 'exchange_rate' => 1.362400, 'is_base' => false],
            ['code' => 'AUD', 'name' => 'Australian Dollar', 'symbol' => 'A$', 'exchange_rate' => 1.532100, 'is_base' => false],
        ];
        foreach ($currencies as $c) {
            Currency::create($c);
        }

        // ── Chart of Accounts (36 accounts) ───────────────────
        $accounts = [
            // Assets
            ['code' => '1000', 'name' => 'Cash', 'type' => 'ASSET', 'sub_type' => 'Current'],
            ['code' => '1010', 'name' => 'Bank Account - Operating', 'type' => 'ASSET', 'sub_type' => 'Current'],
            ['code' => '1020', 'name' => 'Money Market Fund', 'type' => 'ASSET', 'sub_type' => 'Current'],
            ['code' => '1100', 'name' => 'Investments - Equities', 'type' => 'ASSET', 'sub_type' => 'Investments'],
            ['code' => '1110', 'name' => 'Investments - Fixed Income', 'type' => 'ASSET', 'sub_type' => 'Investments'],
            ['code' => '1120', 'name' => 'Investments - Derivatives', 'type' => 'ASSET', 'sub_type' => 'Investments'],
            ['code' => '1130', 'name' => 'Investments - Private Equity', 'type' => 'ASSET', 'sub_type' => 'Investments'],
            ['code' => '1140', 'name' => 'Investments - Real Estate', 'type' => 'ASSET', 'sub_type' => 'Investments'],
            ['code' => '1200', 'name' => 'Accounts Receivable', 'type' => 'ASSET', 'sub_type' => 'Current'],
            ['code' => '1300', 'name' => 'Accrued Interest Receivable', 'type' => 'ASSET', 'sub_type' => 'Current'],
            ['code' => '1400', 'name' => 'Prepaid Expenses', 'type' => 'ASSET', 'sub_type' => 'Current'],
            // Liabilities
            ['code' => '2000', 'name' => 'Accounts Payable', 'type' => 'LIABILITY', 'sub_type' => 'Current'],
            ['code' => '2100', 'name' => 'Accrued Expenses', 'type' => 'LIABILITY', 'sub_type' => 'Current'],
            ['code' => '2200', 'name' => 'Management Fees Payable', 'type' => 'LIABILITY', 'sub_type' => 'Current'],
            ['code' => '2300', 'name' => 'Performance Fees Payable', 'type' => 'LIABILITY', 'sub_type' => 'Current'],
            ['code' => '2400', 'name' => 'Redemptions Payable', 'type' => 'LIABILITY', 'sub_type' => 'Current'],
            ['code' => '2500', 'name' => 'Notes Payable', 'type' => 'LIABILITY', 'sub_type' => 'Long-term'],
            // Equity
            ['code' => '3000', 'name' => 'Partners Capital', 'type' => 'EQUITY', 'sub_type' => 'Capital'],
            ['code' => '3100', 'name' => 'Retained Earnings', 'type' => 'EQUITY', 'sub_type' => 'Retained'],
            ['code' => '3200', 'name' => 'Current Year Earnings', 'type' => 'EQUITY', 'sub_type' => 'Retained'],
            // Revenue
            ['code' => '4000', 'name' => 'Realized Gains - Equities', 'type' => 'REVENUE', 'sub_type' => 'Gains'],
            ['code' => '4010', 'name' => 'Realized Gains - Fixed Income', 'type' => 'REVENUE', 'sub_type' => 'Gains'],
            ['code' => '4100', 'name' => 'Unrealized Gains', 'type' => 'REVENUE', 'sub_type' => 'Gains'],
            ['code' => '4200', 'name' => 'Dividend Income', 'type' => 'REVENUE', 'sub_type' => 'Income'],
            ['code' => '4300', 'name' => 'Interest Income', 'type' => 'REVENUE', 'sub_type' => 'Income'],
            ['code' => '4350', 'name' => 'Management Fee Income', 'type' => 'REVENUE', 'sub_type' => 'Fee Income'],
            ['code' => '4400', 'name' => 'Performance Fee Income', 'type' => 'REVENUE', 'sub_type' => 'Fee Income'],
            // Expenses
            ['code' => '5000', 'name' => 'Management Fees', 'type' => 'EXPENSE', 'sub_type' => 'Operating'],
            ['code' => '5100', 'name' => 'Administration Fees', 'type' => 'EXPENSE', 'sub_type' => 'Operating'],
            ['code' => '5200', 'name' => 'Audit & Legal Fees', 'type' => 'EXPENSE', 'sub_type' => 'Professional'],
            ['code' => '5300', 'name' => 'Custodian Fees', 'type' => 'EXPENSE', 'sub_type' => 'Operating'],
            ['code' => '5400', 'name' => 'Trading Commissions', 'type' => 'EXPENSE', 'sub_type' => 'Trading'],
            ['code' => '5500', 'name' => 'Interest Expense', 'type' => 'EXPENSE', 'sub_type' => 'Finance'],
            ['code' => '5600', 'name' => 'Realized Losses', 'type' => 'EXPENSE', 'sub_type' => 'Losses'],
            ['code' => '5700', 'name' => 'Unrealized Losses', 'type' => 'EXPENSE', 'sub_type' => 'Losses'],
            ['code' => '5800', 'name' => 'Foreign Exchange Loss', 'type' => 'EXPENSE', 'sub_type' => 'Losses'],
        ];
        $accountModels = [];
        foreach ($accounts as $a) {
            $accountModels[$a['code']] = Account::create(array_merge($a, [
                'currency' => 'USD',
                'is_active' => true,
                'balance' => 0,
            ]));
        }

        // ── Assets ─────────────────────────────────────────────
        $assets = [
            ['symbol' => 'AAPL', 'name' => 'Apple Inc.', 'asset_class' => 'EQUITY', 'sub_class' => 'Large Cap', 'currency' => 'USD', 'exchange' => 'NASDAQ', 'sector' => 'Technology', 'country' => 'US', 'current_price' => 178.720000],
            ['symbol' => 'MSFT', 'name' => 'Microsoft Corporation', 'asset_class' => 'EQUITY', 'sub_class' => 'Large Cap', 'currency' => 'USD', 'exchange' => 'NASDAQ', 'sector' => 'Technology', 'country' => 'US', 'current_price' => 415.560000],
            ['symbol' => 'GOOGL', 'name' => 'Alphabet Inc.', 'asset_class' => 'EQUITY', 'sub_class' => 'Large Cap', 'currency' => 'USD', 'exchange' => 'NASDAQ', 'sector' => 'Technology', 'country' => 'US', 'current_price' => 175.980000],
            ['symbol' => 'AMZN', 'name' => 'Amazon.com Inc.', 'asset_class' => 'EQUITY', 'sub_class' => 'Large Cap', 'currency' => 'USD', 'exchange' => 'NASDAQ', 'sector' => 'Consumer Discretionary', 'country' => 'US', 'current_price' => 185.630000],
            ['symbol' => 'JPM', 'name' => 'JPMorgan Chase & Co.', 'asset_class' => 'EQUITY', 'sub_class' => 'Large Cap', 'currency' => 'USD', 'exchange' => 'NYSE', 'sector' => 'Financials', 'country' => 'US', 'current_price' => 198.450000],
            ['symbol' => 'BRK.B', 'name' => 'Berkshire Hathaway Inc.', 'asset_class' => 'EQUITY', 'sub_class' => 'Large Cap', 'currency' => 'USD', 'exchange' => 'NYSE', 'sector' => 'Financials', 'country' => 'US', 'current_price' => 412.350000],
            ['symbol' => 'NVDA', 'name' => 'NVIDIA Corporation', 'asset_class' => 'EQUITY', 'sub_class' => 'Large Cap', 'currency' => 'USD', 'exchange' => 'NASDAQ', 'sector' => 'Technology', 'country' => 'US', 'current_price' => 875.280000],
            ['symbol' => 'US10Y', 'name' => 'US Treasury 10-Year Bond', 'asset_class' => 'FIXED_INCOME', 'sub_class' => 'Government', 'currency' => 'USD', 'exchange' => null, 'sector' => null, 'country' => 'US', 'current_price' => 98.750000],
            ['symbol' => 'CORP_AA', 'name' => 'Corporate Bond AA Portfolio', 'asset_class' => 'FIXED_INCOME', 'sub_class' => 'Corporate', 'currency' => 'USD', 'exchange' => null, 'sector' => null, 'country' => 'US', 'current_price' => 101.250000],
            ['symbol' => 'SPX_CALL', 'name' => 'S&P 500 Call Option', 'asset_class' => 'DERIVATIVE', 'sub_class' => 'Options', 'currency' => 'USD', 'exchange' => 'CBOE', 'sector' => null, 'country' => 'US', 'current_price' => 45.200000],
            ['symbol' => 'PE_FUND_I', 'name' => 'Private Equity Fund I', 'asset_class' => 'PRIVATE_EQUITY', 'sub_class' => 'Buyout', 'currency' => 'USD', 'exchange' => null, 'sector' => null, 'country' => 'US', 'current_price' => 1250.000000],
            ['symbol' => 'RE_TRUST', 'name' => 'Real Estate Investment Trust', 'asset_class' => 'REAL_ESTATE', 'sub_class' => 'Commercial', 'currency' => 'USD', 'exchange' => null, 'sector' => 'Real Estate', 'country' => 'US', 'current_price' => 52.800000],
            ['symbol' => 'GOLD', 'name' => 'Gold Bullion', 'asset_class' => 'COMMODITY', 'sub_class' => 'Precious Metals', 'currency' => 'USD', 'exchange' => 'COMEX', 'sector' => null, 'country' => 'US', 'current_price' => 2345.600000],
            ['symbol' => 'USD_CASH', 'name' => 'US Dollar Cash', 'asset_class' => 'CASH', 'sub_class' => null, 'currency' => 'USD', 'exchange' => null, 'sector' => null, 'country' => 'US', 'current_price' => 1.000000],
        ];
        $assetModels = [];
        foreach ($assets as $a) {
            $assetModels[$a['symbol']] = Asset::create(array_merge($a, [
                'price_date' => Carbon::today(),
                'is_active' => true,
            ]));
        }

        // ── Benchmarks ────────────────────────────────────────
        $spx = Benchmark::create([
            'name' => 'S&P 500 Index',
            'code' => 'SPX',
            'description' => 'Standard & Poor\'s 500 large-cap equity index',
            'provider' => 'S&P Dow Jones Indices',
        ]);

        $agg = Benchmark::create([
            'name' => 'Bloomberg US Aggregate Bond Index',
            'code' => 'AGG',
            'description' => 'Broad-based fixed income benchmark',
            'provider' => 'Bloomberg',
        ]);

        // ── Portfolios ────────────────────────────────────────
        $mainFund = Portfolio::create([
            'name' => 'FundCount Main Fund',
            'code' => 'MAIN',
            'description' => 'Primary multi-strategy fund',
            'currency' => 'USD',
            'inception_date' => '2020-01-15',
            'benchmark_id' => $spx->id,
            'is_active' => true,
            'total_value' => 125000000.0000,
        ]);

        $equityFund = Portfolio::create([
            'name' => 'FundCount Equity Fund',
            'code' => 'EQF',
            'description' => 'Long-only equity strategy',
            'currency' => 'USD',
            'inception_date' => '2021-06-01',
            'benchmark_id' => $spx->id,
            'is_active' => true,
            'total_value' => 45000000.0000,
        ]);

        $fixedIncome = Portfolio::create([
            'name' => 'FundCount Fixed Income',
            'code' => 'FIF',
            'description' => 'Investment-grade fixed income portfolio',
            'currency' => 'USD',
            'inception_date' => '2022-03-01',
            'benchmark_id' => $agg->id,
            'is_active' => true,
            'total_value' => 30000000.0000,
        ]);

        // ── Positions ─────────────────────────────────────────
        // Main Fund - 12 positions
        $mainPositions = [
            ['asset' => 'AAPL', 'quantity' => 50000, 'avg_cost' => 165.50, 'market_value' => 8936000, 'unrealized' => 661000, 'weight' => 7.15],
            ['asset' => 'MSFT', 'quantity' => 25000, 'avg_cost' => 380.20, 'market_value' => 10389000, 'unrealized' => 884000, 'weight' => 8.31],
            ['asset' => 'GOOGL', 'quantity' => 35000, 'avg_cost' => 160.40, 'market_value' => 6159300, 'unrealized' => 545300, 'weight' => 4.93],
            ['asset' => 'AMZN', 'quantity' => 30000, 'avg_cost' => 170.80, 'market_value' => 5568900, 'unrealized' => 444900, 'weight' => 4.46],
            ['asset' => 'JPM', 'quantity' => 40000, 'avg_cost' => 178.30, 'market_value' => 7938000, 'unrealized' => 806000, 'weight' => 6.35],
            ['asset' => 'BRK.B', 'quantity' => 15000, 'avg_cost' => 385.00, 'market_value' => 6185250, 'unrealized' => 410250, 'weight' => 4.95],
            ['asset' => 'NVDA', 'quantity' => 12000, 'avg_cost' => 720.50, 'market_value' => 10503360, 'unrealized' => 1857360, 'weight' => 8.40],
            ['asset' => 'US10Y', 'quantity' => 200000, 'avg_cost' => 99.50, 'market_value' => 19750000, 'unrealized' => -150000, 'weight' => 15.80],
            ['asset' => 'CORP_AA', 'quantity' => 100000, 'avg_cost' => 100.00, 'market_value' => 10125000, 'unrealized' => 125000, 'weight' => 8.10],
            ['asset' => 'SPX_CALL', 'quantity' => 500, 'avg_cost' => 38.00, 'market_value' => 22600, 'unrealized' => 3600, 'weight' => 0.02],
            ['asset' => 'PE_FUND_I', 'quantity' => 8000, 'avg_cost' => 1100.00, 'market_value' => 10000000, 'unrealized' => 1200000, 'weight' => 8.00],
            ['asset' => 'USD_CASH', 'quantity' => 29422590, 'avg_cost' => 1.00, 'market_value' => 29422590, 'unrealized' => 0, 'weight' => 23.54],
        ];
        foreach ($mainPositions as $p) {
            Position::create([
                'portfolio_id' => $mainFund->id,
                'asset_id' => $assetModels[$p['asset']]->id,
                'quantity' => $p['quantity'],
                'avg_cost_basis' => $p['avg_cost'],
                'market_value' => $p['market_value'],
                'unrealized_pnl' => $p['unrealized'],
                'realized_pnl' => 0,
                'weight' => $p['weight'],
                'currency' => 'USD',
                'open_date' => '2024-01-15',
            ]);
        }

        // Equity Fund - 4 positions
        $eqPositions = [
            ['asset' => 'AAPL', 'quantity' => 20000, 'avg_cost' => 168.00, 'market_value' => 3574400, 'unrealized' => 214400, 'weight' => 7.94],
            ['asset' => 'MSFT', 'quantity' => 10000, 'avg_cost' => 390.00, 'market_value' => 4155600, 'unrealized' => 255600, 'weight' => 9.23],
            ['asset' => 'NVDA', 'quantity' => 5000, 'avg_cost' => 750.00, 'market_value' => 4376400, 'unrealized' => 626400, 'weight' => 9.73],
            ['asset' => 'USD_CASH', 'quantity' => 32893600, 'avg_cost' => 1.00, 'market_value' => 32893600, 'unrealized' => 0, 'weight' => 73.10],
        ];
        foreach ($eqPositions as $p) {
            Position::create([
                'portfolio_id' => $equityFund->id,
                'asset_id' => $assetModels[$p['asset']]->id,
                'quantity' => $p['quantity'],
                'avg_cost_basis' => $p['avg_cost'],
                'market_value' => $p['market_value'],
                'unrealized_pnl' => $p['unrealized'],
                'realized_pnl' => 0,
                'weight' => $p['weight'],
                'currency' => 'USD',
                'open_date' => '2024-06-01',
            ]);
        }

        // Fixed Income - 2 positions
        $fiPositions = [
            ['asset' => 'US10Y', 'quantity' => 150000, 'avg_cost' => 99.00, 'market_value' => 14812500, 'unrealized' => -37500, 'weight' => 49.38],
            ['asset' => 'CORP_AA', 'quantity' => 150000, 'avg_cost' => 100.50, 'market_value' => 15187500, 'unrealized' => 112500, 'weight' => 50.63],
        ];
        foreach ($fiPositions as $p) {
            Position::create([
                'portfolio_id' => $fixedIncome->id,
                'asset_id' => $assetModels[$p['asset']]->id,
                'quantity' => $p['quantity'],
                'avg_cost_basis' => $p['avg_cost'],
                'market_value' => $p['market_value'],
                'unrealized_pnl' => $p['unrealized'],
                'realized_pnl' => 0,
                'weight' => $p['weight'],
                'currency' => 'USD',
                'open_date' => '2024-03-01',
            ]);
        }

        // ── Trades ────────────────────────────────────────────
        $trades = [
            ['number' => 'TRD-00001', 'portfolio' => $mainFund, 'asset' => 'AAPL', 'type' => 'BUY', 'qty' => 5000, 'price' => 175.20, 'date' => '2026-04-15', 'status' => 'SETTLED'],
            ['number' => 'TRD-00002', 'portfolio' => $mainFund, 'asset' => 'NVDA', 'type' => 'BUY', 'qty' => 2000, 'price' => 860.50, 'date' => '2026-04-14', 'status' => 'SETTLED'],
            ['number' => 'TRD-00003', 'portfolio' => $equityFund, 'asset' => 'MSFT', 'type' => 'BUY', 'qty' => 3000, 'price' => 412.30, 'date' => '2026-04-12', 'status' => 'SETTLED'],
            ['number' => 'TRD-00004', 'portfolio' => $mainFund, 'asset' => 'GOOGL', 'type' => 'SELL', 'qty' => 5000, 'price' => 174.50, 'date' => '2026-04-10', 'status' => 'SETTLED'],
            ['number' => 'TRD-00005', 'portfolio' => $fixedIncome, 'asset' => 'US10Y', 'type' => 'BUY', 'qty' => 50000, 'price' => 98.90, 'date' => '2026-04-08', 'status' => 'EXECUTED'],
            ['number' => 'TRD-00006', 'portfolio' => $mainFund, 'asset' => 'AMZN', 'type' => 'BUY', 'qty' => 4000, 'price' => 183.40, 'date' => '2026-04-05', 'status' => 'SETTLED'],
        ];
        foreach ($trades as $t) {
            $total = $t['qty'] * $t['price'];
            Trade::create([
                'trade_number' => $t['number'],
                'portfolio_id' => $t['portfolio']->id,
                'asset_id' => $assetModels[$t['asset']]->id,
                'trade_type' => $t['type'],
                'quantity' => $t['qty'],
                'price' => $t['price'],
                'total_amount' => $total,
                'commission' => round($total * 0.0005, 4),
                'fees' => round($total * 0.0002, 4),
                'currency' => 'USD',
                'exchange_rate' => 1.0,
                'trade_date' => $t['date'],
                'settlement_date' => Carbon::parse($t['date'])->addDays(2)->toDateString(),
                'status' => $t['status'],
            ]);
        }

        // ── NAV History (30 days for main fund) ───────────────
        $baseNav = 124000000;
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            if ($date->isWeekend()) {
                continue;
            }
            $dailyReturn = (mt_rand(-50, 80) / 10000); // -0.5% to +0.8%
            $baseNav = $baseNav * (1 + $dailyReturn);
            NAVHistory::create([
                'portfolio_id' => $mainFund->id,
                'date' => $date->toDateString(),
                'nav' => round($baseNav, 4),
                'total_assets' => round($baseNav * 1.02, 4),
                'total_liabilities' => round($baseNav * 0.02, 4),
                'shares_outstanding' => 1000000,
                'nav_per_share' => round($baseNav / 1000000, 6),
                'daily_return' => round($dailyReturn, 6),
            ]);
        }

        // ── Partners ──────────────────────────────────────────
        $gp = Partner::create([
            'name' => 'FundCount Capital GP LLC',
            'type' => 'GENERAL_PARTNER',
            'email' => 'gp@fundcountcapital.com',
            'phone' => '+1-212-555-0100',
            'tax_id' => '12-3456789',
            'commitment_amount' => 16000000,
            'paid_in_capital' => 16000000,
            'distributed_amount' => 2400000,
            'ownership_pct' => 8.0000,
            'is_active' => true,
            'join_date' => '2020-01-15',
        ]);

        $williams = Partner::create([
            'name' => 'Williams Family Office',
            'type' => 'LIMITED_PARTNER',
            'email' => 'invest@williamsfamily.com',
            'phone' => '+1-212-555-0200',
            'tax_id' => '23-4567890',
            'commitment_amount' => 40000000,
            'paid_in_capital' => 40000000,
            'distributed_amount' => 5200000,
            'ownership_pct' => 20.0000,
            'is_active' => true,
            'join_date' => '2020-01-15',
        ]);

        $henderson = Partner::create([
            'name' => 'Henderson Pension Fund',
            'type' => 'LIMITED_PARTNER',
            'email' => 'allocations@hendersonpension.com',
            'phone' => '+1-312-555-0300',
            'tax_id' => '34-5678901',
            'commitment_amount' => 64000000,
            'paid_in_capital' => 64000000,
            'distributed_amount' => 8500000,
            'ownership_pct' => 32.0000,
            'is_active' => true,
            'join_date' => '2020-03-01',
        ]);

        $pacific = Partner::create([
            'name' => 'Pacific Endowment Fund',
            'type' => 'LIMITED_PARTNER',
            'email' => 'invest@pacificendowment.org',
            'phone' => '+1-415-555-0400',
            'tax_id' => '45-6789012',
            'commitment_amount' => 48000000,
            'paid_in_capital' => 48000000,
            'distributed_amount' => 6100000,
            'ownership_pct' => 24.0000,
            'is_active' => true,
            'join_date' => '2020-06-15',
        ]);

        $sovereign = Partner::create([
            'name' => 'Sovereign Wealth Advisory',
            'type' => 'LIMITED_PARTNER',
            'email' => 'funds@sovereignwealth.com',
            'phone' => '+44-20-7555-0500',
            'tax_id' => '56-7890123',
            'commitment_amount' => 32000000,
            'paid_in_capital' => 32000000,
            'distributed_amount' => 3800000,
            'ownership_pct' => 16.0000,
            'is_active' => true,
            'join_date' => '2021-01-10',
        ]);

        // ── Capital Accounts (Q1 2026 for 4 LPs) ─────────────
        $capitalData = [
            ['partner' => $williams, 'begin' => 25000000, 'contrib' => 500000, 'withdraw' => 0, 'income' => 320000, 'expense' => -45000, 'gainloss' => 580000, 'mgmt' => -62500, 'perf' => -116000],
            ['partner' => $henderson, 'begin' => 40000000, 'contrib' => 0, 'withdraw' => -1000000, 'income' => 512000, 'expense' => -72000, 'gainloss' => 928000, 'mgmt' => -100000, 'perf' => -185600],
            ['partner' => $pacific, 'begin' => 30000000, 'contrib' => 2000000, 'withdraw' => 0, 'income' => 384000, 'expense' => -54000, 'gainloss' => 696000, 'mgmt' => -75000, 'perf' => -139200],
            ['partner' => $sovereign, 'begin' => 20000000, 'contrib' => 0, 'withdraw' => 0, 'income' => 256000, 'expense' => -36000, 'gainloss' => 464000, 'mgmt' => -50000, 'perf' => -92800],
        ];
        foreach ($capitalData as $cd) {
            $ending = $cd['begin'] + $cd['contrib'] + $cd['withdraw'] + $cd['income'] + $cd['expense'] + $cd['gainloss'] + $cd['mgmt'] + $cd['perf'];
            CapitalAccount::create([
                'partner_id' => $cd['partner']->id,
                'period_start' => '2026-01-01',
                'period_end' => '2026-03-31',
                'beginning_balance' => $cd['begin'],
                'contributions' => $cd['contrib'],
                'withdrawals' => $cd['withdraw'],
                'income_allocation' => $cd['income'],
                'expense_allocation' => $cd['expense'],
                'gain_loss_allocation' => $cd['gainloss'],
                'management_fee' => $cd['mgmt'],
                'performance_fee' => $cd['perf'],
                'ending_balance' => $ending,
            ]);
        }

        // ── Partner Allocations ───────────────────────────────
        $allPartners = [$gp, $williams, $henderson, $pacific, $sovereign];
        foreach ($allPartners as $partner) {
            PartnerAllocation::create([
                'partner_id' => $partner->id,
                'portfolio_id' => $mainFund->id,
                'allocation_pct' => $partner->ownership_pct,
                'class_type' => $partner->type === 'GENERAL_PARTNER' ? 'GP' : 'A',
                'is_active' => true,
                'effective_date' => $partner->join_date,
            ]);
        }

        // ── Journal Entries ───────────────────────────────────
        // JE1: Equity purchase (POSTED)
        $je1 = JournalEntry::create([
            'entry_number' => 'JE-00001',
            'date' => '2026-04-15',
            'description' => 'Purchase of AAPL shares - 5,000 shares @ $175.20',
            'reference' => 'TRD-00001',
            'status' => 'POSTED',
            'currency' => 'USD',
            'exchange_rate' => 1.0,
            'total_amount' => 876000.0000,
            'created_by_id' => $admin->id,
            'posted_at' => now(),
        ]);
        JournalLine::create(['journal_entry_id' => $je1->id, 'account_id' => $accountModels['1100']->id, 'description' => 'AAPL 5,000 shares', 'debit_amount' => 876000, 'credit_amount' => 0]);
        JournalLine::create(['journal_entry_id' => $je1->id, 'account_id' => $accountModels['1000']->id, 'description' => 'Cash payment', 'debit_amount' => 0, 'credit_amount' => 876000]);

        // JE2: Dividend income (POSTED)
        $je2 = JournalEntry::create([
            'entry_number' => 'JE-00002',
            'date' => '2026-04-10',
            'description' => 'Quarterly dividend received - AAPL',
            'reference' => 'DIV-AAPL-Q1',
            'status' => 'POSTED',
            'currency' => 'USD',
            'exchange_rate' => 1.0,
            'total_amount' => 48500.0000,
            'created_by_id' => $admin->id,
            'posted_at' => now(),
        ]);
        JournalLine::create(['journal_entry_id' => $je2->id, 'account_id' => $accountModels['1000']->id, 'description' => 'Cash received', 'debit_amount' => 48500, 'credit_amount' => 0]);
        JournalLine::create(['journal_entry_id' => $je2->id, 'account_id' => $accountModels['4200']->id, 'description' => 'Dividend income', 'debit_amount' => 0, 'credit_amount' => 48500]);

        // JE3: Management fee accrual (APPROVED)
        $je3 = JournalEntry::create([
            'entry_number' => 'JE-00003',
            'date' => '2026-03-31',
            'description' => 'Q1 2026 management fee accrual (2% annual)',
            'reference' => 'FEE-Q1-2026',
            'status' => 'APPROVED',
            'currency' => 'USD',
            'exchange_rate' => 1.0,
            'total_amount' => 625000.0000,
            'created_by_id' => $manager->id,
            'approved_at' => now(),
        ]);
        JournalLine::create(['journal_entry_id' => $je3->id, 'account_id' => $accountModels['5000']->id, 'description' => 'Management fee expense', 'debit_amount' => 625000, 'credit_amount' => 0]);
        JournalLine::create(['journal_entry_id' => $je3->id, 'account_id' => $accountModels['2200']->id, 'description' => 'Mgmt fees payable', 'debit_amount' => 0, 'credit_amount' => 625000]);

        // JE4: Draft entry
        $je4 = JournalEntry::create([
            'entry_number' => 'JE-00004',
            'date' => '2026-04-18',
            'description' => 'Custodian fee accrual - April 2026',
            'reference' => 'CUST-APR-2026',
            'status' => 'DRAFT',
            'currency' => 'USD',
            'exchange_rate' => 1.0,
            'total_amount' => 15000.0000,
            'created_by_id' => $analyst->id,
        ]);
        JournalLine::create(['journal_entry_id' => $je4->id, 'account_id' => $accountModels['5300']->id, 'description' => 'Custodian fee', 'debit_amount' => 15000, 'credit_amount' => 0]);
        JournalLine::create(['journal_entry_id' => $je4->id, 'account_id' => $accountModels['2100']->id, 'description' => 'Accrued expenses', 'debit_amount' => 0, 'credit_amount' => 15000]);

        // ── Performance Records (Jan-Mar 2026, main fund) ─────
        $perfData = [
            ['date' => '2026-01-31', 'total' => 2.340000, 'bench' => 1.850000, 'alloc' => 0.180000, 'select' => 0.250000, 'inter' => 0.060000, 'fx' => 0.000000, 'sharpe' => 1.820000, 'vol' => 12.450000, 'dd' => -3.200000],
            ['date' => '2026-02-28', 'total' => 1.870000, 'bench' => 1.420000, 'alloc' => 0.150000, 'select' => 0.220000, 'inter' => 0.080000, 'fx' => 0.000000, 'sharpe' => 1.750000, 'vol' => 11.800000, 'dd' => -2.800000],
            ['date' => '2026-03-31', 'total' => -0.450000, 'bench' => -0.820000, 'alloc' => 0.120000, 'select' => 0.190000, 'inter' => 0.060000, 'fx' => 0.000000, 'sharpe' => 1.650000, 'vol' => 13.200000, 'dd' => -4.100000],
        ];
        foreach ($perfData as $pd) {
            PerformanceRecord::create([
                'portfolio_id' => $mainFund->id,
                'date' => $pd['date'],
                'period_type' => 'MONTHLY',
                'total_return' => $pd['total'],
                'benchmark_return' => $pd['bench'],
                'alpha_return' => round($pd['total'] - $pd['bench'], 6),
                'allocation_effect' => $pd['alloc'],
                'selection_effect' => $pd['select'],
                'interaction_effect' => $pd['inter'],
                'currency_effect' => $pd['fx'],
                'sharpe_ratio' => $pd['sharpe'],
                'volatility' => $pd['vol'],
                'max_drawdown' => $pd['dd'],
            ]);
        }

        // ── Investor Profile ──────────────────────────────────
        InvestorProfile::create([
            'user_id' => $investor->id,
            'partner_id' => $williams->id,
            'accredited' => true,
            'kyc_status' => 'VERIFIED',
            'kyc_date' => '2025-12-15',
            'risk_profile' => 'MODERATE_AGGRESSIVE',
        ]);

        // ── Fiscal Periods ────────────────────────────────────
        FiscalPeriod::create([
            'name' => 'Q1 2026',
            'start_date' => '2026-01-01',
            'end_date' => '2026-03-31',
            'is_closed' => true,
            'closed_at' => '2026-04-05 10:00:00',
        ]);

        FiscalPeriod::create([
            'name' => 'Q2 2026',
            'start_date' => '2026-04-01',
            'end_date' => '2026-06-30',
            'is_closed' => false,
        ]);

        // ── Settings ──────────────────────────────────────────
        $settings = [
            ['key' => 'company.name', 'value' => 'FundCount Capital Management', 'group' => 'company'],
            ['key' => 'company.currency', 'value' => 'USD', 'group' => 'company'],
            ['key' => 'company.fiscalYearEnd', 'value' => '12-31', 'group' => 'company'],
            ['key' => 'company.timezone', 'value' => 'America/New_York', 'group' => 'company'],
            ['key' => 'accounting.method', 'value' => 'ACCRUAL', 'group' => 'accounting'],
            ['key' => 'accounting.autoPostJournals', 'value' => 'false', 'group' => 'accounting'],
            ['key' => 'accounting.requireApproval', 'value' => 'true', 'group' => 'accounting'],
            ['key' => 'portfolio.defaultCurrency', 'value' => 'USD', 'group' => 'portfolio'],
            ['key' => 'portfolio.navFrequency', 'value' => 'DAILY', 'group' => 'portfolio'],
            ['key' => 'reporting.defaultFormat', 'value' => 'PDF', 'group' => 'reporting'],
            ['key' => 'fees.managementRate', 'value' => '2.00', 'group' => 'fees'],
            ['key' => 'fees.performanceRate', 'value' => '20.00', 'group' => 'fees'],
            ['key' => 'fees.hurdleRate', 'value' => '8.00', 'group' => 'fees'],
        ];
        foreach ($settings as $s) {
            Setting::create($s);
        }
    }
}
