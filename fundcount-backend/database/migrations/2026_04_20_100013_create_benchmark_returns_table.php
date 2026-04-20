<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('benchmark_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('benchmark_id')->constrained('benchmarks')->cascadeOnDelete();
            $table->date('date');
            $table->decimal('daily_return', 12, 6)->default(0);
            $table->decimal('mtd_return', 12, 6)->default(0);
            $table->decimal('ytd_return', 12, 6)->default(0);
            $table->timestamps();

            $table->unique(['benchmark_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('benchmark_returns');
    }
};
