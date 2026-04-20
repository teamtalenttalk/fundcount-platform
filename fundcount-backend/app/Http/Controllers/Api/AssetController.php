<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    public function index(Request $request)
    {
        $query = Asset::query();

        if ($request->has('asset_class')) {
            $query->where('asset_class', $request->asset_class);
        }

        return response()->json($query->orderBy('symbol')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'symbol' => 'required|string|unique:assets,symbol',
            'name' => 'required|string|max:255',
            'asset_class' => 'required|string|in:' . implode(',', Asset::ASSET_CLASSES),
            'sub_class' => 'nullable|string',
            'currency' => 'nullable|string|max:3',
            'exchange' => 'nullable|string',
            'sector' => 'nullable|string',
            'country' => 'nullable|string',
            'current_price' => 'nullable|numeric',
            'price_date' => 'nullable|date',
            'is_active' => 'boolean',
            'metadata' => 'nullable|array',
        ]);

        $asset = Asset::create($validated);

        return response()->json($asset, 201);
    }
}
