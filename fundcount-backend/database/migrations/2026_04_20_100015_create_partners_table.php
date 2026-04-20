<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type'); // GENERAL_PARTNER, LIMITED_PARTNER, MANAGING_MEMBER, MEMBER
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('tax_id')->nullable();
            $table->decimal('commitment_amount', 20, 4)->default(0);
            $table->decimal('paid_in_capital', 20, 4)->default(0);
            $table->decimal('distributed_amount', 20, 4)->default(0);
            $table->decimal('ownership_pct', 8, 4)->default(0);
            $table->boolean('is_active')->default(true);
            $table->date('join_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partners');
    }
};
