<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Position;

class PositionController extends Controller
{
    public function index()
    {
        return response()->json(
            Position::with(['portfolio', 'asset'])->get()
        );
    }
}
