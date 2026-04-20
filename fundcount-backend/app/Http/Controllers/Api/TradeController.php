<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trade;
use Illuminate\Http\Request;

class TradeController extends Controller
{
    public function index(Request $request)
    {
        $query = Trade::with(['portfolio', 'asset']);

        if ($request->has('portfolio_id')) {
            $query->where('portfolio_id', $request->portfolio_id);
        }

        if ($request->has('trade_type')) {
            $query->where('trade_type', $request->trade_type);
        }

        return response()->json($query->orderByDesc('trade_date')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'portfolio_id' => 'required|exists:portfolios,id',
            'asset_id' => 'required|exists:assets,id',
            'trade_type' => 'required|string|in:' . implode(',', Trade::TRADE_TYPES),
            'quantity' => 'required|numeric',
            'price' => 'required|numeric',
            'total_amount' => 'nullable|numeric',
            'commission' => 'nullable|numeric',
            'fees' => 'nullable|numeric',
            'currency' => 'nullable|string|max:3',
            'exchange_rate' => 'nullable|numeric',
            'settlement_date' => 'nullable|date',
            'trade_date' => 'required|date',
            'status' => 'nullable|string|in:' . implode(',', Trade::STATUSES),
            'notes' => 'nullable|string',
        ]);

        // Auto-generate trade number
        $lastTrade = Trade::orderByDesc('id')->first();
        $nextNum = $lastTrade ? intval(substr($lastTrade->trade_number, 4)) + 1 : 1;
        $validated['trade_number'] = 'TRD-' . str_pad($nextNum, 5, '0', STR_PAD_LEFT);

        if (empty($validated['total_amount'])) {
            $validated['total_amount'] = $validated['quantity'] * $validated['price'];
        }

        $trade = Trade::create($validated);

        return response()->json($trade->load(['portfolio', 'asset']), 201);
    }
}
