<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateCustomerRequest;
use App\Http\Resources\Api\CustomerResource;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    private const COUNTS = [
        'salesInvoices',
        'rejectedSales',
    ];

    private const EDITABLE_FIELDS = [
        'phone',
        'email',
        'address',
        'city',
        'country',
        'tax_number',
        'is_active',
    ];

    // Picker — active customers, any authed user
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Customer::query()
            ->where('is_active', true)
            ->orderBy('customer_name');

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('erpnext_customer', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('loyalty_card_number', 'like', "%{$search}%");
            });
        }

        return CustomerResource::collection($query->limit(100)->get());
    }

    // Admin list — all customers + counts, any authed user
    public function listAll(Request $request): JsonResponse
    {
        $query = Customer::query()->withCount(self::COUNTS);

        // Search filter
        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('erpnext_customer', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('loyalty_card_number', 'like', "%{$search}%");
            });
        }

        // Active filter
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $paginator = $query->orderBy('customer_name')->paginate(50);

        return response()->json([
            'data' => CustomerResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ]
        ]);
    }

    // Show — single customer + counts
    public function show(Request $request, Customer $customer): CustomerResource
    {
        $customer->loadCount(self::COUNTS);

        return new CustomerResource($customer);
    }

    // Update — operational fields only, any authed user, audit-logged
    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        $validated = $request->validated();
        $payload   = array_intersect_key($validated, array_flip(self::EDITABLE_FIELDS));

        if (empty($payload)) {
            return response()->json([
                'message' => 'No editable fields were provided.',
            ], 422);
        }

        $changes = [];
        foreach ($payload as $field => $newValue) {
            $oldValue = $customer->{$field};
            if ((string) $oldValue !== (string) $newValue) {
                $changes[$field] = ['old' => $oldValue, 'new' => $newValue];
            }
        }

        if (empty($changes)) {
            $customer->loadCount(self::COUNTS);
            return response()->json([
                'message' => 'No changes to save.',
                'data'    => new CustomerResource($customer),
            ]);
        }

        DB::transaction(function () use ($customer, $payload, $changes, $request) {
            $customer->fill($payload);
            $customer->save();

            DB::table('audit_logs')->insert([
                'company_id'  => null,
                'user_id'     => $request->user()?->id,
                'action'      => 'customer_update',
                'module'      => 'customers',
                'entity_type' => 'Customer',
                'entity_id'   => $customer->id,
                'old_values'  => json_encode(array_map(fn($c) => $c['old'], $changes)),
                'new_values'  => json_encode(array_map(fn($c) => $c['new'], $changes)),
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        });

        $customer->refresh()->loadCount(self::COUNTS);

        return response()->json([
            'message' => 'Customer updated.',
            'data'    => new CustomerResource($customer),
        ]);
    }
}
