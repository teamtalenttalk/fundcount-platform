<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trades', function (Blueprint $table) {
            $table->id();
            $table->string('trade_number')->unique();
            $table->foreignId('portfolio_id')->constrained('portfolios')->cascadeOnDelete();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->string('trade_type'); // BUY, SELL, SHORT, COVER, DIVIDEND, INTEREST, TRANSFER
            $table->decimal('quantity', 20, 6)->default(0);
            $table->decimal('price', 20, 6)->default(0);
            $table->decimal('total_amount', 20, 4)->default(0);
            $table->decimal('commission', 20, 4)->default(0);
            $table->decimal('fees', 20, 4)->default(0);
            $table->string('currency')->default('USD');
            $table->decimal('exchange_rate', 12, 6)->default(1.000000);
            $table->date('settlement_date')->nullable();
            $table->date('trade_date');
            $table->string('status')->default('PENDING'); // PENDING, EXECUTED, SETTLED, CANCELLED
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trades');
    }
};
