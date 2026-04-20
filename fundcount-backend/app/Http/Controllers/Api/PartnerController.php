<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use Illuminate\Http\Request;

class PartnerController extends Controller
{
    public function index()
    {
        return response()->json(
            Partner::with('capitalAccounts')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:' . implode(',', Partner::TYPES),
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'tax_id' => 'nullable|string',
            'commitment_amount' => 'nullable|numeric',
            'paid_in_capital' => 'nullable|numeric',
            'distributed_amount' => 'nullable|numeric',
            'ownership_pct' => 'nullable|numeric',
            'is_active' => 'boolean',
            'join_date' => 'nullable|date',
        ]);

        $partner = Partner::create($validated);

        return response()->json($partner, 201);
    }
}
