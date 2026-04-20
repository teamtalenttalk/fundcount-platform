<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InvestorProfile;

class InvestorController extends Controller
{
    public function index()
    {
        return response()->json(
            InvestorProfile::with(['user', 'partner'])->get()
        );
    }
}
