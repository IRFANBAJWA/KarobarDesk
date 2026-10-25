<?php

namespace App\Http\Requests\Api\Pos;

/**
 * Same shape as a normal sale payload, but validated against the
 * cashier's corrected items. The client_request_id stays the same as
 * the original rejected sale so idempotency + linkage work.
 */
class UpdateRejectedSaleRequest extends StorePosSaleRequest
{
    // Inherits all rules from StorePosSaleRequest — no additions needed.
    // The controller enforces that the rejected_sales row exists, is pending,
    // and belongs to the authenticated user.
}
