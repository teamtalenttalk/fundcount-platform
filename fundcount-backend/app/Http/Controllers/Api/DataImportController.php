<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DataImport;

class DataImportController extends Controller
{
    public function index()
    {
        return response()->json(
            DataImport::with('dataSource')->orderByDesc('created_at')->get()
        );
    }
}
