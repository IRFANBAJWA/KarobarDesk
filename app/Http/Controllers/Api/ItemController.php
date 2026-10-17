<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateItemRequest;
use App\Http\Resources\Api\ItemResource;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ItemController extends Controller
{
    private const EDITABLE_FIELDS = [
        'item_name',
        'alias',
        'barcode',
        'description',
        'item_group',
        'brand',
        'weight',
        'weight_uom',
        'cost_price',
        'standard_rate',
        'tax_rate',
        'is_taxable',
        'is_active',
    ];

    private const COUNTS = [
        'itemPrices',
        'itemStocks',
        'stockLedgers',
        'salesInvoiceItems',
        'purchaseOrderItems',
        'purchaseReceiptItems',
        'companyItemStatuses',
    ];

    // ---------------------------------------------------------------------
    // Picker — active items, any authenticated user
    // ---------------------------------------------------------------------

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Item::query()
            ->where('is_active', true)
            ->orderBy('item_name');

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('erpnext_item_code', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%")
                    ->orWhere('alias', 'like', "%{$search}%");
            });
        }

        return ItemResource::collection($query->limit(100)->get());
    }

    // ---------------------------------------------------------------------
    // Admin list — all items + counts, SA / admin / manager only
    // ---------------------------------------------------------------------

    public function listAll(Request $request): AnonymousResourceCollection
    {
        $this->authorizeAdminManager($request);

        $items = Item::query()
            ->withCount(self::COUNTS)
            ->orderBy('item_name')
            ->get();


        return ItemResource::collection($items);
    }

    // ---------------------------------------------------------------------
    // Show — single item + counts
    // ---------------------------------------------------------------------

    public function show(Request $request, Item $item): ItemResource
    {
        $this->authorizeAdminManager($request);

        $item->loadCount(self::COUNTS);

        return new ItemResource($item);
    }

    // ---------------------------------------------------------------------
    // Update — local fields only, audit-logged, sync_status untouched
    // ---------------------------------------------------------------------

    public function update(UpdateItemRequest $request, Item $item): JsonResponse
    {
        $this->authorizeAdminManager($request);

        $validated = $request->validated();
        $payload   = array_intersect_key($validated, array_flip(self::EDITABLE_FIELDS));

        if (empty($payload)) {
            return response()->json([
                'message' => 'No editable fields were provided.',
            ], 422);
        }

        // Capture only fields whose value actually changes
        $changes = [];
        foreach ($payload as $field => $newValue) {
            $oldValue = $item->{$field};
            if ((string) $oldValue !== (string) $newValue) {
                $changes[$field] = ['old' => $oldValue, 'new' => $newValue];
            }
        }

        if (empty($changes)) {
            $item->loadCount(self::COUNTS);
            return response()->json([
                'message' => 'No changes to save.',
                'data'    => new ItemResource($item),
            ]);
        }

        DB::transaction(function () use ($item, $payload, $changes, $request) {
            $item->fill($payload);
            $item->save();

            DB::table('audit_logs')->insert([
                'company_id'  => null,
                'user_id'     => $request->user()?->id,
                'action'      => 'item_update',
                'module'      => 'items',
                'entity_type' => 'Item',
                'entity_id'   => $item->id,
                'old_values'  => json_encode(array_map(fn($c) => $c['old'], $changes)),
                'new_values'  => json_encode(array_map(fn($c) => $c['new'], $changes)),
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        });

        $item->refresh()->loadCount(self::COUNTS);

        return response()->json([
            'message' => 'Item updated.',
            'data'    => new ItemResource($item),
        ]);
    }

    // ---------------------------------------------------------------------
    // Guard
    // ---------------------------------------------------------------------

    private function authorizeAdminManager(Request $request): void
    {
        $user = $request->user();

        if (! $user || ! $user->hasAnyRole(['super_admin', 'admin', 'manager'])) {
            abort(403, 'You do not have permission to access items.');
        }
    }

    // ---------------------------------------------------------------------
    // Picker-all — every item, lightweight payload for dropdowns
    // ---------------------------------------------------------------------

    public function pickerAll(Request $request): JsonResponse
    {
        $items = Item::query()
            ->select(['id', 'item_name', 'erpnext_item_code', 'item_group', 'is_active'])
            ->orderBy('item_name')
            ->get()
            ->map(fn($item) => [
                'id'         => $item->id,
                'item_name'  => $item->item_name,
                'item_code'  => $item->erpnext_item_code,
                'item_group' => $item->item_group,
                'is_active'  => (bool) $item->is_active,
            ]);

        return response()->json(['data' => $items]);
    }
}
