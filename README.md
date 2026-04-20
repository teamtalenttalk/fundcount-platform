# FundCount Platform

Portfolio Accounting & Investment Management Platform (FundCount + QuickBooks Clone)

## Tech Stack
- **Frontend**: Vite.js + React + TypeScript + Tailwind CSS + shadcn/ui + Recharts
- **Backend**: Laravel 12 + PHP 8.3 + SQLite
- **Auth**: Laravel Sanctum (token-based)

## Setup

### Backend
```bash
cd fundcount-backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan db:seed
php artisan serve
```

### Frontend
```bash
cd fundcount-frontend
npm install
npm run dev
```

### Demo Credentials
- Admin: admin@fundcount.com / admin123
- Manager: manager@fundcount.com / manager123
- Analyst: analyst@fundcount.com / analyst123
- Investor: investor@fundcount.com / investor123

## Modules
1. **General Ledger** - Chart of Accounts, Journal Entries, Trial Balance, Reconciliation
2. **Portfolio Accounting** - Portfolios, Assets, Positions, Trades, NAV
3. **Performance Attribution** - Returns, Benchmarks, Alpha, Sharpe Ratio
4. **Partnership Accounting** - GP/LP Partners, Capital Accounts, Allocations
5. **Investor Portal** - KYC Profiles, Documents
6. **Data Aggregation** - Sources, Imports
7. **Reporting** - 6 Report Types
8. **Settings** - Company Config, Users, Currencies, Fiscal Periods
