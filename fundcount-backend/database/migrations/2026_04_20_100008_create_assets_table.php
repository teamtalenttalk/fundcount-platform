<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('symbol')->unique();
            $table->string('name');
            $table->string('asset_class'); // EQUITY, FIXED_INCOME, DERIVATIVE, PRIVATE_EQUITY, REAL_ESTATE, COMMODITY, CURRENCY, CASH, OTHER
            $table->string('sub_class')->nullable();
            $table->string('currency')->default('USD');
            $table->string('exchange')->nullable();
            $table->string('sector')->nullable();
            $table->string('country')->nullable();
            $table->decimal('current_price', 20, 6)->default(0);
            $table->date('price_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
