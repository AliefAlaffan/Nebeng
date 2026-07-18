<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PickupPointController;
use App\Http\Controllers\Api\ItemOrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PinController;
use App\Http\Controllers\Api\PasswordController;
use App\Http\Controllers\Api\RewardController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\BalanceController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminVerifController;
use App\Http\Controllers\Api\AdminOrderController;
use App\Http\Controllers\Api\Admin\UserProfileController;
use App\Http\Controllers\Api\VerificationController;
use App\Http\Controllers\Api\PosDashboardController;
use App\Http\Controllers\Api\MitraTripQrController;
use App\Services\Maps\OSRMService;
use App\Http\Controllers\Api\TripJourneyController;
use App\Http\Controllers\Api\TripReviewController;
use App\Http\Controllers\Api\CustomerOrderQrController;
use App\Http\Controllers\Api\AdminPricingController;


Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::put('/admin/users/{id}/block', [AdminController::class, 'blockUser']);
Route::post('/admin/unblock-user/{id}', [AdminController::class, 'unblockUser']);

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/profile', [ProfileController::class, 'me']);
    Route::post('/profile/update',[ProfileController::class,'update']);
    Route::get('/check-pin', [PinController::class, 'checkPin']);
    Route::post('/update-pin', [PinController::class, 'updatePin']);
    Route::post('/update-password', [PasswordController::class, 'updatePassword']);
    Route::post('/verify-pin', [PinController::class, 'verifyPin']);

});

Route::middleware(['auth:sanctum'])->group(function () {

    Route::get('/admin/pricing',[AdminPricingController::class, 'index']);

    Route::put('/admin/pricing',[AdminPricingController::class, 'update']);

});

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/mitra/trips/{id}/generate-qr',[MitraTripQrController::class, 'generate']);
    Route::post('/mitra/trips/{tripId}/generate-departure-qr',[MitraTripQrController::class, 'generateDepartureQr']);
    Route::post('/pos-mitra/scan-qr', [TripController::class, 'scanQr']);
    Route::post('/pos-mitra/scan-departure-qr',[TripController::class, 'scanDepartureQr']);
    Route::post('/pos-mitra/scan-customer-qr', [TripController::class, 'scanCustomerQr']);
    Route::post('/customer/orders/{orderId}/generate-qr',[CustomerOrderQrController::class, 'generate']);
});


Route::get('/test-route', function (OSRMService $osrm) {

    return $osrm->getRoute(
        -7.801389,
        110.364444,
        -7.424444,
        109.239444
    );

});

// Perjalanan Maps
Route::get('/trips/{id}/journey', [TripJourneyController::class, 'show']);

Route::post('/trips/{id}/tracking', [TripJourneyController::class, 'updateTracking']);

Route::get('/trips/{id}/latest-location', [TripJourneyController::class, 'latestLocation']);

Route::post('/trips/{id}/status', [TripJourneyController::class, 'updateStatus']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/balance', [BalanceController::class, 'getBalance']);
    Route::get('/balance/history', [BalanceController::class, 'history']);
    Route::post('/balance/withdraw', [BalanceController::class, 'withdraw']);
});

Route::middleware('auth:sanctum')->get('/reward-points', function (Request $request) {
    return response()->json([
        'reward_points' => $request->user()->reward_points
    ]);
});

Route::middleware('auth:sanctum')->post('/reward/redeem', [RewardController::class, 'redeem']);

Route::middleware('auth:sanctum')->get('/reward-history', function (Request $request) {

    return $request->user()
        ->rewardTransactions()
        ->latest()  
        ->get();

});

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/conversations',[ChatController::class,'conversations']);

    Route::get('/conversations/{id}/messages',[ChatController::class,'messages']);

    Route::post('/messages',[ChatController::class,'sendMessage']);

    Route::post('/conversations/{id}/mark-read',[ChatController::class,'markAsRead']);

});

    Route::post('/trips/preview', [TripController::class, 'preview']);

    Route::post('/trips/search', [TripController::class, 'search']);

    Route::get('/trips/{id}', [TripController::class, 'show']);

    Route::get('/pickup-points', [PickupPointController::class,'index']);

    Route::middleware('auth:sanctum')->post('/trips/{trip}/review',[TripReviewController::class, 'store']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/trip-reviews', [TripReviewController::class, 'store']);
    });

Route::middleware('auth:sanctum')->post('/mitra/trips', [TripController::class, 'store']);


Route::middleware(['auth:sanctum','role:admin'])->group(function () {

    Route::get('/admin/dashboard', function () {
        return response()->json(['message' => 'Admin dashboard']);
    });

});

Route::middleware('auth:sanctum')->group(function () {

    // VERIFIKASI MITRA
    Route::get('/admin/mitra/pending', [AdminVerifController::class, 'pending']);
    Route::get('/admin/mitra/{id}', [AdminVerifController::class, 'show']);
    Route::put('/admin/mitra/{id}/approve', [AdminVerifController::class, 'approve']);
    Route::put('/admin/mitra/{id}/reject', [AdminVerifController::class, 'reject']);

    // VERIFIKASI CUSTOMER
    Route::get('/admin/customer/pending', [AdminVerifController::class, 'pendingCustomer']);
    Route::put('/admin/customer/{id}/reject', [AdminVerifController::class, 'rejectCustomer']);

    // DATA ORDER
     Route::get('/admin/orders', [AdminOrderController::class, 'index']);

     Route::middleware('auth:sanctum')->group(function () {

        // history HARUS di atas
        Route::get('/orders/history', [OrderController::class, 'history']);

        // detail order di bawah
        Route::get('/orders/{id}', [OrderController::class, 'show']);

    });

    //  DATA MITRA
    Route::get('/admin/mitra', [AdminController::class, 'mitraList']);

    //  DATA CUSTOMER
    Route::get('/admin/customers', [AdminController::class, 'customersList']);

  
    // USER PROFILE
    Route::get('/admin/users/{id}/profile', [UserProfileController::class, 'show']);
    Route::post('/admin/users/{id}/profile', [UserProfileController::class, 'storeOrUpdate']);
});

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/verification/status', [VerificationController::class, 'status']);
    Route::post('/verification', [VerificationController::class, 'store']);
    Route::post('/admin/verifications/{id}/approve', [VerificationController::class, 'approve']);

});

// POS Dashboard Stats
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/pos/dashboard-stats', [PosDashboardController::class, 'stats']);

});

Route::middleware(['auth:sanctum'])->get('/admin/dashboard', [AdminController::class, 'dashboard']);

Route::middleware(['auth:sanctum','role:mitra'])->group(function () {

    Route::get('/mitra/dashboard', function () {
        return response()->json(['message' => 'Mitra dashboard']);
    });

    Route::get('/mitra/trips', [TripController::class, 'myTrips']);

});

Route::middleware(['auth:sanctum', 'role:pos_mitra'])->group(function () {

    Route::get('/pos-mitra/trips', [TripController::class, 'posMitraTrips']);

});

Route::middleware(['auth:sanctum','role:customer' ])->group(function () {

    Route::get('/customer/dashboard', function () {
        return response()->json(['message' => 'Customer dashboard']);
    });

    Route::post('/orders', [OrderController::class, 'store']);

    Route::post('/item-orders', [ItemOrderController::class,'store']);

    Route::post('/payment', [PaymentController::class, 'createPayment']);
});