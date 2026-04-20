<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reconciliations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('book_balance', 20, 4)->default(0);
            $table->decimal('bank_balance', 20, 4)->default(0);
            $table->decimal('difference', 20, 4)->default(0);
            $table->string('status')->default('PENDING'); // PENDING, IN_PROGRESS, COMPLETED, DISCREPANCY
            $table->text('notes')->nullable();
            $table->timestamp('reconciled_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reconciliations');
    }
};
