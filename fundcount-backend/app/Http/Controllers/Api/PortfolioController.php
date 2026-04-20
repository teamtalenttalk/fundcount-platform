<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Portfolio;
use Illuminate\Http\Request;

class PortfolioController extends Controller
{
    public function index()
    {
        $portfolios = Portfolio::withCount('positions')
            ->with('benchmark')
            ->get();

        return response()->json($portfolios);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:portfolios,code',
            'description' => 'nullable|string',
            'currency' => 'nullable|string|max:3',
            'inception_date' => 'nullable|date',
            'benchmark_id' => 'nullable|exists:benchmarks,id',
            'is_active' => 'boolean',
            'total_value' => 'nullable|numeric',
        ]);

        $portfolio = Portfolio::create($validated);

        return response()->json($portfolio, 201);
    }

    public function show(Portfolio $portfolio)
    {
        $portfolio->load([
            'positions.asset',
            'trades.asset',
            'navHistories' => fn($q) => $q->orderByDesc('date')->limit(30),
            'benchmark',
        ]);

        return response()->json($portfolio);
    }
}
