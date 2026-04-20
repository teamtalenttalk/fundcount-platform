<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->date('date');
            $table->decimal('open', 20, 6)->default(0);
            $table->decimal('high', 20, 6)->default(0);
            $table->decimal('low', 20, 6)->default(0);
            $table->decimal('close', 20, 6)->default(0);
            $table->bigInteger('volume')->default(0);
            $table->string('source')->nullable();
            $table->timestamps();

            $table->unique(['asset_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_histories');
    }
};
