<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DataSource;
use Illuminate\Http\Request;

class DataSourceController extends Controller
{
    public function index()
    {
        return response()->json(
            DataSource::withCount('imports')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'connection_url' => 'nullable|string',
            'api_key' => 'nullable|string',
            'schedule' => 'nullable|string',
            'status' => 'nullable|string',
            'config' => 'nullable|array',
        ]);

        $dataSource = DataSource::create($validated);

        return response()->json($dataSource, 201);
    }
}
