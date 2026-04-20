<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalLine;

class TrialBalanceController extends Controller
{
    public function index()
    {
        // Get all posted journal entry IDs
        $postedEntryIds = JournalEntry::where('status', JournalEntry::STATUS_POSTED)
            ->pluck('id');

        // Get journal lines grouped by account
        $lines = JournalLine::whereIn('journal_entry_id', $postedEntryIds)
            ->selectRaw('account_id, SUM(debit_amount) as total_debits, SUM(credit_amount) as total_credits')
            ->groupBy('account_id')
            ->get();

        $accounts = Account::all()->keyBy('id');

        $trialBalance = $lines->map(function ($line) use ($accounts) {
            $account = $accounts->get($line->account_id);
            return [
                'account_id' => $line->account_id,
                'account_code' => $account?->code,
                'account_name' => $account?->name,
                'account_type' => $account?->type,
                'total_debits' => round((float) $line->total_debits, 4),
                'total_credits' => round((float) $line->total_credits, 4),
                'balance' => round((float) $line->total_debits - (float) $line->total_credits, 4),
            ];
        })->sortBy('account_code')->values();

        $totalDebits = $trialBalance->sum('total_debits');
        $totalCredits = $trialBalance->sum('total_credits');

        return response()->json([
            'accounts' => $trialBalance,
            'totals' => [
                'total_debits' => round($totalDebits, 4),
                'total_credits' => round($totalCredits, 4),
                'difference' => round($totalDebits - $totalCredits, 4),
            ],
        ]);
    }
}
