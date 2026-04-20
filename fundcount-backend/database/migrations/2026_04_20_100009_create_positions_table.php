<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('positions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('portfolio_id')->constrained('portfolios')->cascadeOnDelete();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->decimal('quantity', 20, 6)->default(0);
            $table->decimal('avg_cost_basis', 20, 6)->default(0);
            $table->decimal('market_value', 20, 4)->default(0);
            $table->decimal('unrealized_pnl', 20, 4)->default(0);
            $table->decimal('realized_pnl', 20, 4)->default(0);
            $table->decimal('weight', 8, 4)->default(0);
            $table->string('currency')->default('USD');
            $table->date('open_date')->nullable();
            $table->date('close_date')->nullable();
            $table->timestamps();

            $table->unique(['portfolio_id', 'asset_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('positions');
    }
};
