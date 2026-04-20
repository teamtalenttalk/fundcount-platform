<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PerformanceRecord;
use Illuminate\Http\Request;

class PerformanceController extends Controller
{
    public function index(Request $request)
    {
        $query = PerformanceRecord::with('portfolio');

        if ($request->has('portfolio_id')) {
            $query->where('portfolio_id', $request->portfolio_id);
        }

        if ($request->has('period_type')) {
            $query->where('period_type', $request->period_type);
        }

        return response()->json($query->orderByDesc('date')->get());
    }
}
