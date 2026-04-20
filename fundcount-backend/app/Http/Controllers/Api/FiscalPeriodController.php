<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FiscalPeriod;

class FiscalPeriodController extends Controller
{
    public function index()
    {
        return response()->json(FiscalPeriod::orderBy('start_date')->get());
    }
}
