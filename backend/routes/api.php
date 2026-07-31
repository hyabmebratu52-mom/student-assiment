<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/students', function () {
    return response()->json([
        ['id' => 1, 'name' => 'አበበ በላቸው'],
        ['id' => 2, 'name' => 'ከበደ ተሰማ'],
        ['id' => 3, 'name' => 'ሀና ማሞ']
    ]);
});