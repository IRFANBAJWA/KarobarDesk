<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\ItemRowAssignment;
use App\Models\ItemStock;
use App\Models\StockRow;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ItemRowAssignmentController extends Controller
{
    public function __construct(private AuditLogger $auditLogger) {}

    // =====================================================
    // UNASSIGNED ITEMS (paginated)
    // =====================================================
    public function unassigned(Request $request): JsonResponse
    {
        $companyId = $this->resolveCompanyId($request);
        if (!$companyId) {
            return response()->json(['message' => 'No company selected.'], 422);
        }
        if ($err = $this->authorizeManager($request)) return $err;

        $search = $request->query('search');
        $hideZero = $request->boolean('hide_zero_stock', true);

        $assignedItemIds = ItemRowAssignment::where('company_id', $companyId)
            ->pluck('item_id')
            ->all();

        $query = Item::query()
            ->where('is_active', true)
            ->whereNotIn('id', $assignedItemIds);

        if ($hideZero) {
            $query->whereHas('itemStocks', fn($q) => $q->where('company_id', $companyId)->where('qty', '>', 0));
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('erpnext_item_code', 'like', "%{$search}%");
            });
        }

        $items = $query->orderBy('item_name')
            ->paginate(50)
            ->through(function (Item $item) use ($companyId) {
                $qty = ItemStock::where('company_id', $companyId)
                    ->where('item_id', $item->id)
                    ->sum('qty');

                return [
                    'id'                 => $item->id,
                    'item_name'          => $item->item_name,
                    'erpnext_item_code'  => $item->erpnext_item_code,
                    'item_group'         => $item->item_group,
                    'system_qty'         => (float) $qty,
                ];
            });

        return response()->json([
            'data' => $items->items(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page'    => $items->lastPage(),
                'total'        => $items->total(),
                'per_page'     => $items->perPage(),
            ],
        ]);
    }

    // =====================================================
    // ASSIGN (one or many items to a row)
    // =====================================================
    public function store(Request $request): JsonResponse
    {
        $companyId = $this->resolveCompanyId($request);
        if (!$companyId) {
            return response()->json(['message' => 'No company selected.'], 422);
        }
        if ($err = $this->authorizeManager($request)) return $err;

        $validated = $request->validate([
            'stock_row_id' => 'required|exists:stock_rows,id',
            'item_ids'     => 'required|array|min:1',
            'item_ids.*'   => 'required|integer|exists:items,id',
        ]);

        $row = StockRow::find($validated['stock_row_id']);

        if ((int) $row->company_id !== $companyId) {
            return response()->json(['message' => 'Row does not belong to the active company.'], 422);
        }

        $itemIds = array_unique($validated['item_ids']);

        $createdCount = 0;
        $movedCount = 0;
        $skippedCount = 0;

        DB::transaction(function () use ($row, $companyId, $itemIds, $request, &$createdCount, &$movedCount, &$skippedCount) {
            foreach ($itemIds as $itemId) {
                $existing = ItemRowAssignment::where('company_id', $companyId)
                    ->where('item_id', $itemId)
                    ->first();

                if ($existing) {
                    if ((int) $existing->stock_row_id === (int) $row->id) {
                        $skippedCount++;
                        continue;
                    }

                    $oldRowId = $existing->stock_row_id;
                    $existing->update(['stock_row_id' => $row->id]);

                    $this->auditLogger->log(
                        action: 'item_row_assigned',
                        module: 'stock_setup',
                        companyId: $companyId,
                        userId: $request->user()->id,
                        entityType: 'item_row_assignment',
                        entityId: $existing->id,
                        oldValues: ['item_id' => $itemId, 'stock_row_id' => $oldRowId],
                        newValues: ['item_id' => $itemId, 'stock_row_id' => $row->id],
                        request: $request,
                    );

                    $movedCount++;
                    continue;
                }

                $assignment = ItemRowAssignment::create([
                    'company_id'    => $companyId,
                    'item_id'       => $itemId,
                    'stock_row_id'  => $row->id,
                ]);

                $this->auditLogger->log(
                    action: 'item_row_assigned',
                    module: 'stock_setup',
                    companyId: $companyId,
                    userId: $request->user()->id,
                    entityType: 'item_row_assignment',
                    entityId: $assignment->id,
                    oldValues: null,
                    newValues: ['item_id' => $itemId, 'stock_row_id' => $row->id],
                    request: $request,
                );

                $createdCount++;
            }
        });

        return response()->json([
            'message' => "Assigned: {$createdCount} new, {$movedCount} moved, {$skippedCount} unchanged.",
            'summary' => [
                'created' => $createdCount,
                'moved'   => $movedCount,
                'skipped' => $skippedCount,
            ],
        ]);
    }

    // =====================================================
    // UNASSIGN (remove one item from its row)
    // =====================================================
    public function destroy(Request $request, ItemRowAssignment $assignment): JsonResponse
    {
        $companyId = $this->resolveCompanyId($request);
        if ($err = $this->authorizeManager($request)) return $err;

        if ((int) $assignment->company_id !== (int) $companyId) {
            return response()->json(['message' => 'Assignment not found in the active company.'], 404);
        }

        // Block removal if audit counts exist for today on this item's row? No —
        // unassigning an item does not change the row owner, so the lock does not apply.
        // But if today's audit already has a stock_audit_item for this item with a count,
        // we still allow unassign (the count remains attributed to whoever entered it).

        $old = $assignment->toArray();
        $assignment->delete();

        $this->auditLogger->log(
            action: 'item_row_unassigned',
            module: 'stock_setup',
            companyId: $companyId,
            userId: $request->user()->id,
            entityType: 'item_row_assignment',
            entityId: $old['id'],
            oldValues: $old,
            newValues: null,
            request: $request,
        );

        return response()->json(['message' => 'Item unassigned from its row.']);
    }

    // =====================================================
    // BY ROW (list items currently in a specific row)
    // =====================================================
    public function byRow(Request $request, StockRow $row): JsonResponse
    {
        $companyId = $this->resolveCompanyId($request);
        if (!$companyId) {
            return response()->json(['message' => 'No company selected.'], 422);
        }

        if ((int) $row->company_id !== $companyId) {
            return response()->json(['message' => 'Row not found in the active company.'], 404);
        }

        $assignments = ItemRowAssignment::where('company_id', $companyId)
            ->where('stock_row_id', $row->id)
            ->with(['item:id,item_name,erpnext_item_code,item_group,is_active'])
            ->orderBy('id')
            ->get();

        $data = $assignments->map(function (ItemRowAssignment $a) use ($companyId) {
            $qty = ItemStock::where('company_id', $companyId)
                ->where('item_id', $a->item_id)
                ->sum('qty');

            return [
                'id'                => $a->id,
                'item'              => $a->item ? [
                    'id'                => $a->item->id,
                    'item_name'         => $a->item->item_name,
                    'erpnext_item_code' => $a->item->erpnext_item_code,
                    'item_group'        => $a->item->item_group,
                    'is_active'         => (bool) $a->item->is_active,
                ] : null,
                'system_qty'        => (float) $qty,
            ];
        });

        return response()->json(['data' => $data]);
    }

    // =====================================================
    // HELPERS
    // =====================================================

    private function resolveCompanyId(Request $request): ?int
    {
        $user = $request->user();
        $companyId = $user->company_id;

        if (!$companyId || $user->hasRole('admin') || $user->isSuperAdmin()) {
            $companyId = $request->query('company_id')
                ?: $request->input('company_id')
                ?: $user->companies()->first()?->id;
        }

        return $companyId ? (int) $companyId : null;
    }

    private function authorizeManager(Request $request): ?JsonResponse
    {
        $user = $request->user();

        if ($user->isSuperAdmin() || $user->hasRole('admin') || $user->hasRole('manager')) {
            return null;
        }

        return response()->json(['message' => 'Forbidden.'], 403);
    }
}
