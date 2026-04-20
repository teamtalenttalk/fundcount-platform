<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JournalEntryController extends Controller
{
    public function index(Request $request)
    {
        $query = JournalEntry::with(['lines.account', 'createdBy']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderByDesc('date')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'description' => 'required|string|max:500',
            'reference' => 'nullable|string|max:100',
            'status' => 'nullable|string|in:' . implode(',', JournalEntry::STATUSES),
            'currency' => 'nullable|string|max:3',
            'exchange_rate' => 'nullable|numeric',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|exists:accounts,id',
            'lines.*.description' => 'nullable|string',
            'lines.*.debit_amount' => 'nullable|numeric|min:0',
            'lines.*.credit_amount' => 'nullable|numeric|min:0',
            'lines.*.currency' => 'nullable|string|max:3',
            'lines.*.exchange_rate' => 'nullable|numeric',
        ]);

        // Validate debits = credits
        $totalDebits = collect($validated['lines'])->sum('debit_amount');
        $totalCredits = collect($validated['lines'])->sum('credit_amount');

        if (round($totalDebits, 4) !== round($totalCredits, 4)) {
            return response()->json([
                'message' => 'Total debits must equal total credits.',
                'errors' => ['lines' => ['Total debits (' . $totalDebits . ') must equal total credits (' . $totalCredits . ')']],
            ], 422);
        }

        $entry = DB::transaction(function () use ($validated, $request, $totalDebits) {
            // Auto-generate entry number
            $lastEntry = JournalEntry::orderByDesc('id')->first();
            $nextNum = $lastEntry ? intval(substr($lastEntry->entry_number, 3)) + 1 : 1;
            $entryNumber = 'JE-' . str_pad($nextNum, 5, '0', STR_PAD_LEFT);

            $entry = JournalEntry::create([
                'entry_number' => $entryNumber,
                'date' => $validated['date'],
                'description' => $validated['description'],
                'reference' => $validated['reference'] ?? null,
                'status' => $validated['status'] ?? JournalEntry::STATUS_DRAFT,
                'currency' => $validated['currency'] ?? 'USD',
                'exchange_rate' => $validated['exchange_rate'] ?? 1.0,
                'total_amount' => $totalDebits,
                'created_by_id' => $request->user()->id,
            ]);

            foreach ($validated['lines'] as $line) {
                $entry->lines()->create([
                    'account_id' => $line['account_id'],
                    'description' => $line['description'] ?? null,
                    'debit_amount' => $line['debit_amount'] ?? 0,
                    'credit_amount' => $line['credit_amount'] ?? 0,
                    'currency' => $line['currency'] ?? 'USD',
                    'exchange_rate' => $line['exchange_rate'] ?? 1.0,
                ]);
            }

            return $entry->load(['lines.account', 'createdBy']);
        });

        return response()->json($entry, 201);
    }

    public function show(JournalEntry $journalEntry)
    {
        return response()->json($journalEntry->load(['lines.account', 'createdBy']));
    }

    public function update(Request $request, JournalEntry $journalEntry)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:' . implode(',', JournalEntry::STATUSES),
        ]);

        $updates = ['status' => $validated['status']];

        if ($validated['status'] === JournalEntry::STATUS_APPROVED) {
            $updates['approved_at'] = now();
        } elseif ($validated['status'] === JournalEntry::STATUS_POSTED) {
            $updates['posted_at'] = now();
        }

        $journalEntry->update($updates);

        return response()->json($journalEntry->load(['lines.account', 'createdBy']));
    }
}
