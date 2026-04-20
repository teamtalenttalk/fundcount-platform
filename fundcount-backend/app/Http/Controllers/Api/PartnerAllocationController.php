<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PartnerAllocation;

class PartnerAllocationController extends Controller
{
    public function index()
    {
        return response()->json(
            PartnerAllocation::with(['partner', 'portfolio'])->get()
        );
    }
}
