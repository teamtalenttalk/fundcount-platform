<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(
            User::select(['id', 'name', 'email', 'role', 'phone', 'company', 'is_active', 'avatar', 'created_at', 'updated_at'])->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'nullable|string|in:' . implode(',', User::ROLES),
            'phone' => 'nullable|string',
            'company' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $user = User::create($validated);

        return response()->json($user->makeHidden('password'), 201);
    }
}
