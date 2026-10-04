<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\TransientToken;

class LogoutController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function logout(Request $request): JsonResponse
    {
        $user  = $request->user();
        $token = $user?->currentAccessToken();

        // Only real persisted tokens can (and should) be deleted.
        // Session-authenticated requests get a TransientToken which has no delete().
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
            $mode = 'pos';
        } else {
            // SPA: session -> invalidate it
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            $mode = 'spa';
        }

        $this->audit->log(
            action: 'logout',
            module: 'auth',
            companyId: $user?->company_id,
            userId: $user?->id,
            entityType: $user ? get_class($user) : null,
            entityId: $user?->id,
            newValues: ['client_type' => $mode],
        );

        return response()->json(['message' => 'Logged out.']);
    }
}
