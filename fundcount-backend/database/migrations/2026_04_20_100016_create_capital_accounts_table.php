<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('capital_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners')->cascadeOnDelete();
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('beginning_balance', 20, 4)->default(0);
            $table->decimal('contributions', 20, 4)->default(0);
            $table->decimal('withdrawals', 20, 4)->default(0);
            $table->decimal('income_allocation', 20, 4)->default(0);
            $table->decimal('expense_allocation', 20, 4)->default(0);
            $table->decimal('gain_loss_allocation', 20, 4)->default(0);
            $table->decimal('management_fee', 20, 4)->default(0);
            $table->decimal('performance_fee', 20, 4)->default(0);
            $table->decimal('ending_balance', 20, 4)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('capital_accounts');
    }
};
