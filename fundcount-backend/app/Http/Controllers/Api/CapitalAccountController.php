<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CapitalAccount;

class CapitalAccountController extends Controller
{
    public function index()
    {
        return response()->json(
            CapitalAccount::with('partner')->get()
        );
    }
}
