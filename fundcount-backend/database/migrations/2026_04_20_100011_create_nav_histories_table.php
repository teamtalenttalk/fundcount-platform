<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nav_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('portfolio_id')->constrained('portfolios')->cascadeOnDelete();
            $table->date('date');
            $table->decimal('nav', 20, 4)->default(0);
            $table->decimal('total_assets', 20, 4)->default(0);
            $table->decimal('total_liabilities', 20, 4)->default(0);
            $table->decimal('shares_outstanding', 20, 6)->default(0);
            $table->decimal('nav_per_share', 20, 6)->default(0);
            $table->decimal('daily_return', 12, 6)->default(0);
            $table->timestamps();

            $table->unique(['portfolio_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nav_histories');
    }
};
