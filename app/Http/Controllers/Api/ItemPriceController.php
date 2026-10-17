<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreItemPriceRequest;
use App\Http\Requests\Api\UpdateItemPriceRequest;
use App\Http\Resources\Api\ItemPriceResource;
use App\Models\ItemPrice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ItemPriceController extends Controller
{
    // ---------------------------------------------------------------------
    // Picker — active prices for a given price list, any authed user
    // ---------------------------------------------------------------------

    public function index(Request $request): JsonResponse
    {
        $query = ItemPrice::query()
            ->with(['priceList', 'item'])
            ->active();

        if ($priceListId = $request->integer('price_list_id')) {
            $query->where('price_list_id', $priceListId);
        }

        if ($search = $request->string('search')->toString()) {
            $query->whereHas('item', function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('erpnext_item_code', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        $prices = $query->orderBy('id')->limit(200)->get();

        return response()->json([
            'data' => ItemPriceResource::collection($prices),
        ]);
    }

    // ---------------------------------------------------------------------
    // Admin list — paginated, filterable
    // ---------------------------------------------------------------------

    public function listAll(Request $request): JsonResponse
    {
        $this->authorizeAdminManager($request);

        $perPage = min(max($request->integer('per_page', 50), 10), 200);

        $query = ItemPrice::query()->with(['priceList', 'item']);

        if ($priceListId = $request->integer('price_list_id')) {
            $query->where('price_list_id', $priceListId);
        }

        if ($itemId = $request->integer('item_id')) {
            $query->where('item_id', $itemId);
        }

        if ($itemGroup = $request->string('item_group')->toString()) {
            $query->whereHas('item', function ($q) use ($itemGroup) {
                $q->where('item_group', $itemGroup);
            });
        }

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('item', function ($q2) use ($search) {
                    $q2->where('item_name', 'like', "%{$search}%")
                        ->orWhere('erpnext_item_code', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%")
                        ->orWhere('alias', 'like', "%{$search}%");
                })->orWhereHas('priceList', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%")
                        ->orWhere('erpnext_name', 'like', "%{$search}%");
                });
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($syncStatus = $request->string('sync_status')->toString()) {
            $query->where('sync_status', $syncStatus);
        }

        $sortBy  = $request->string('sort_by', 'id')->toString();
        $sortDir = $request->string('sort_dir', 'desc')->toString() === 'asc' ? 'asc' : 'desc';
        $allowed = ['id', 'rate', 'pack_rate', 'is_active', 'sync_status', 'created_at', 'updated_at'];

        if (in_array($sortBy, $allowed, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderByDesc('id');
        }

        $paginator = $query->paginate($perPage);

        return response()->json([
            'data' => ItemPriceResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
                'from'         => $paginator->firstItem(),
                'to'           => $paginator->lastItem(),
            ],
        ]);
    }

    // ---------------------------------------------------------------------
    // Show
    // ---------------------------------------------------------------------

    public function show(Request $request, ItemPrice $itemPrice): JsonResponse
    {
        $this->authorizeAdminManager($request);

        $itemPrice->load(['priceList', 'item']);

        return response()->json([
            'data' => new ItemPriceResource($itemPrice),
        ]);
    }

    // ---------------------------------------------------------------------
    // Create
    // ---------------------------------------------------------------------

    public function store(StoreItemPriceRequest $request): JsonResponse
    {
        $this->authorizeAdminManager($request);

        $data = $request->validated();

        $existing = ItemPrice::for($data['price_list_id'], $data['item_id'])->first();

        if ($existing) {
            return response()->json([
                'message' => 'This item already has a price on this list.',
                'errors'  => [
                    'item_id' => ['This item is already priced on the selected list.'],
                ],
            ], 422);
        }

        $created = DB::transaction(function () use ($data, $request) {
            $itemPrice = ItemPrice::create([
                'price_list_id' => $data['price_list_id'],
                'item_id'       => $data['item_id'],
                'rate'          => $data['rate'],
                'pack_rate'     => $data['pack_rate'] ?? null,
                'is_active'     => $data['is_active'] ?? true,
                'sync_status'   => 'pending',
            ]);

            DB::table('audit_logs')->insert([
                'company_id'  => null,
                'user_id'     => $request->user()?->id,
                'action'      => 'item_price_create',
                'module'      => 'item_prices',
                'entity_type' => 'ItemPrice',
                'entity_id'   => $itemPrice->id,
                'old_values'  => null,
                'new_values'  => json_encode([
                    'price_list_id' => $itemPrice->price_list_id,
                    'item_id'       => $itemPrice->item_id,
                    'rate'          => $itemPrice->rate,
                    'pack_rate'     => $itemPrice->pack_rate,
                    'is_active'     => $itemPrice->is_active,
                ]),
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);

            return $itemPrice;
        });

        $created->load(['priceList', 'item']);

        return response()->json([
            'message' => 'Item price created.',
            'data'    => new ItemPriceResource($created),
        ], 201);
    }

    // ---------------------------------------------------------------------
    // Update — rate, pack_rate, is_active only
    // ---------------------------------------------------------------------

    public function update(UpdateItemPriceRequest $request, ItemPrice $itemPrice): JsonResponse
    {
        $this->authorizeAdminManager($request);

        $data = $request->validated();

        if (empty($data)) {
            $itemPrice->load(['priceList', 'item']);
            return response()->json([
                'message' => 'No changes to save.',
                'data'    => new ItemPriceResource($itemPrice),
            ]);
        }

        $changes = [];
        foreach ($data as $field => $newValue) {
            $oldValue = $itemPrice->{$field};
            if ((string) $oldValue !== (string) $newValue) {
                $changes[$field] = ['old' => $oldValue, 'new' => $newValue];
            }
        }

        if (empty($changes)) {
            $itemPrice->load(['priceList', 'item']);
            return response()->json([
                'message' => 'No changes to save.',
                'data'    => new ItemPriceResource($itemPrice),
            ]);
        }

        DB::transaction(function () use ($itemPrice, $data, $changes, $request) {
            $itemPrice->fill($data);
            $itemPrice->save();

            DB::table('audit_logs')->insert([
                'company_id'  => null,
                'user_id'     => $request->user()?->id,
                'action'      => 'item_price_update',
                'module'      => 'item_prices',
                'entity_type' => 'ItemPrice',
                'entity_id'   => $itemPrice->id,
                'old_values'  => json_encode(array_map(fn($c) => $c['old'], $changes)),
                'new_values'  => json_encode(array_map(fn($c) => $c['new'], $changes)),
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        });

        $itemPrice->refresh()->load(['priceList', 'item']);

        return response()->json([
            'message' => 'Item price updated.',
            'data'    => new ItemPriceResource($itemPrice),
        ]);
    }

    // ---------------------------------------------------------------------
    // Guard — super_admin + admin only. No manager.
    // (Method name kept for consistency with the Items module.)
    // ---------------------------------------------------------------------

    private function authorizeAdminManager(Request $request): void
    {
        $user = $request->user();

        if (! $user || ! $user->hasAnyRole(['super_admin', 'admin'])) {
            abort(403, 'Only Super Admin and Admin can manage item prices.');
        }
    }
}
