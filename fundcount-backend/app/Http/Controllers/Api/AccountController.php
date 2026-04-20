<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $query = Account::query();

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('code')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:accounts,code',
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:' . implode(',', Account::TYPES),
            'sub_type' => 'nullable|string',
            'description' => 'nullable|string',
            'currency' => 'nullable|string|max:3',
            'is_active' => 'boolean',
            'parent_id' => 'nullable|exists:accounts,id',
            'balance' => 'nullable|numeric',
        ]);

        $account = Account::create($validated);

        return response()->json($account, 201);
    }

    public function show(Account $account)
    {
        return response()->json($account);
    }

    public function update(Request $request, Account $account)
    {
        $validated = $request->validate([
            'code' => 'sometimes|string|unique:accounts,code,' . $account->id,
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|in:' . implode(',', Account::TYPES),
            'sub_type' => 'nullable|string',
            'description' => 'nullable|string',
            'currency' => 'nullable|string|max:3',
            'is_active' => 'boolean',
            'parent_id' => 'nullable|exists:accounts,id',
            'balance' => 'nullable|numeric',
        ]);

        $account->update($validated);

        return response()->json($account);
    }

    public function destroy(Account $account)
    {
        $account->delete();

        return response()->json(['message' => 'Account deleted successfully']);
    }
}
