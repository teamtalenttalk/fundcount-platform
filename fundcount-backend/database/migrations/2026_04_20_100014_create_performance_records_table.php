<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('portfolio_id')->constrained('portfolios')->cascadeOnDelete();
            $table->date('date');
            $table->string('period_type'); // DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
            $table->decimal('total_return', 12, 6)->default(0);
            $table->decimal('benchmark_return', 12, 6)->default(0);
            $table->decimal('alpha_return', 12, 6)->default(0);
            $table->decimal('allocation_effect', 12, 6)->default(0);
            $table->decimal('selection_effect', 12, 6)->default(0);
            $table->decimal('interaction_effect', 12, 6)->default(0);
            $table->decimal('currency_effect', 12, 6)->default(0);
            $table->decimal('sharpe_ratio', 12, 6)->default(0);
            $table->decimal('volatility', 12, 6)->default(0);
            $table->decimal('max_drawdown', 12, 6)->default(0);
            $table->timestamps();

            $table->unique(['portfolio_id', 'date', 'period_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_records');
    }
};
