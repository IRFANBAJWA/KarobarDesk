<?php

namespace App\Http\Controllers\Api;

use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;
use App\Http\Requests\RetestErpNextRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\ErpNext\ErpNextException;
use App\Services\ErpNext\ErpNextUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\LinkErpNextRequest;

class UserController extends Controller
{
    public function __construct(
        protected AuditLogger $audit,
        protected ErpNextUserService $erp,
    ) {}

    // ---------------------------------------------------------------------
    // INDEX
    // ---------------------------------------------------------------------

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->integer('per_page', 20), 100);

        $users = User::query()
            ->with([
                'company:id,name,code,erpnext_company',
                'companies:id,name,code',
                'roles:id,name,label,is_super_admin',
                // Load the FULL till operation, plus its relations
                'tillOperation',
                'tillOperation.priceList',
                'tillOperation.accounts',
            ])
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search')->toString();
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('erpnext_user', 'like', "%{$search}%");
                });
            })
            ->when(
                $request->has('is_active'),
                fn($q) => $q->where('is_active', $request->boolean('is_active'))
            )
            ->when(
                $request->filled('company_id'),
                fn($q) => $q->where('company_id', $request->integer('company_id'))
            )
            ->when(
                $request->filled('role'),
                fn($q) => $q->whereHas(
                    'roles',
                    fn($r) => $r->where('name', $request->string('role')->toString())
                )
            )
            ->when($request->filled('erpnext'), function ($q) use ($request) {
                match ($request->string('erpnext')->toString()) {
                    'linked'   => $q->whereNotNull('erpnext_user')
                        ->whereNotNull('erpnext_token'),
                    'unlinked' => $q->where(
                        fn($q) => $q->whereNull('erpnext_user')
                            ->orWhereNull('erpnext_token')
                    ),
                    default    => null,
                };
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        // Unhide the return_pin for all users in the list
        $users->getCollection()->transform(function ($user) {
            if ($user->tillOperation) {
                $user->tillOperation->makeVisible('return_pin');
            }
            return $user;
        });

        return response()->json($users);
    }

    // public function show(User $user): JsonResponse
    // {
    //     $user->load([
    //         'company:id,name,code,erpnext_company',
    //         'companies:id,name,code',
    //         'roles:id,name,label,description,is_super_admin',
    //         'tillOperation',
    //         'tillOperation.priceList',
    //         'tillOperation.accounts',
    //     ]);

    //     if ($user->tillOperation) {
    //         $user->tillOperation->makeVisible('return_pin');
    //     }

    //     return response()->json(['data' => $user]);
    // }

    // ---------------------------------------------------------------------
    // SHOW
    // ---------------------------------------------------------------------

    public function show(User $user): JsonResponse
    {
        $user->load([
            'company:id,name,code,erpnext_company',
            'companies:id,name,code',
            'roles:id,name,label,description,is_super_admin',
            'tillOperation',
            'tillOperation.accounts',
        ]);

        if ($user->tillOperation) {
            $user->tillOperation->makeVisible('return_pin');
        }

        return response()->json(['data' => $user]);
    }

    // ---------------------------------------------------------------------
    // STORE — local user only. No ERPNext call.
    // ---------------------------------------------------------------------

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data    = $request->validated();
        $actorId = (int) auth()->id();

        $user = DB::transaction(function () use ($data, $actorId) {
            // 1. Local user
            $user = User::create([
                'name'       => $data['name'],
                'username'   => $data['username'],
                'email'      => $data['email'],
                'password'   => $data['password'],
                'company_id' => $data['company_id'],
                'is_active'  => $data['is_active'] ?? true,
            ]);

            // 2. Roles (names → IDs)
            if (! empty($data['roles'])) {
                $roleIds = Role::query()
                    ->whereIn('name', $data['roles'])
                    ->pluck('id')
                    ->all();
                $user->roles()->sync($roleIds);
            }

            // 3. Multi-company access
            if (! empty($data['company_access'])) {
                $user->companies()->sync($data['company_access']);
            }

            // 4. Audit
            $snapshot = $user->fresh(['roles', 'companies'])->toArray();

            $this->audit->log(
                action: 'user.created',
                module: 'users',
                companyId: $user->company_id,
                userId: $actorId,
                entityType: User::class,
                entityId: $user->id,
                newValues: Arr::except($snapshot, [
                    'password',
                    'erpnext_password',
                    'erpnext_token',
                ]),
            );

            return $user;
        });

        $user->load([
            'company',
            'companies',
            'roles',
            'tillOperation',
            'tillOperation.accounts',
        ]);

        return response()->json([
            'data'    => $user,
            'message' => 'User created.',
        ], 201);
    }

    // ---------------------------------------------------------------------
    // UPDATE
    // ---------------------------------------------------------------------

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        if ($user->isSuperAdmin()) {
            return response()->json([
                'message' => 'The Super Admin account cannot be modified.',
            ], 403);
        }

        $data    = $request->validated();
        $actorId = (int) auth()->id();

        DB::transaction(function () use ($data, $user, $actorId) {
            $before = [
                'name'       => $user->name,
                'username'   => $user->username,
                'email'      => $user->email,
                'company_id' => $user->company_id,
                'is_active'  => (bool) $user->is_active,
                'roles'      => $user->roles()->pluck('name')->all(),
                'companies'  => $user->companies()->pluck('companies.id')->all(),
            ];

            $user->fill([
                'name'       => $data['name'],
                'username'   => $data['username'],
                'email'      => $data['email'],
                'company_id' => $data['company_id'],
            ]);

            if (! empty($data['password'])) {
                $user->password = $data['password'];
            }

            if (array_key_exists('is_active', $data)) {
                $user->is_active = $data['is_active'];
            }

            $user->save();

            // Roles (names → IDs)
            $roleIds = [];
            if (! empty($data['roles'])) {
                $roleIds = Role::query()
                    ->whereIn('name', $data['roles'])
                    ->pluck('id')
                    ->all();
            }
            $user->roles()->sync($roleIds);

            // Company access
            $user->companies()->sync($data['company_access'] ?? []);

            $after = [
                'name'       => $user->name,
                'username'   => $user->username,
                'email'      => $user->email,
                'company_id' => $user->company_id,
                'is_active'  => (bool) $user->is_active,
                'roles'      => $user->roles()->pluck('name')->all(),
                'companies'  => $user->companies()->pluck('companies.id')->all(),
            ];

            $changedBefore = [];
            $changedAfter  = [];
            foreach ($after as $key => $newVal) {
                if (($before[$key] ?? null) !== $newVal) {
                    $changedBefore[$key] = $before[$key] ?? null;
                    $changedAfter[$key]  = $newVal;
                }
            }

            if (! empty($changedAfter)) {
                $this->audit->log(
                    action: 'user.updated',
                    module: 'users',
                    companyId: $user->company_id,
                    userId: $actorId,
                    entityType: User::class,
                    entityId: $user->id,
                    oldValues: $changedBefore,
                    newValues: $changedAfter,
                );
            }
        });

        $user->load([
            'company',
            'companies',
            'roles',
            'tillOperation',
            'tillOperation.accounts',
        ]);

        return response()->json([
            'data'    => $user,
            'message' => 'User updated.',
        ]);
    }

    // ---------------------------------------------------------------------
    // DEACTIVATE
    // ---------------------------------------------------------------------

    public function deactivate(User $user): JsonResponse
    {
        $actorId = (int) auth()->id();

        if ($user->isSuperAdmin()) {
            return response()->json([
                'message' => 'The Super Admin account cannot be deactivated.',
            ], 403);
        }

        if ($user->id === $actorId) {
            return response()->json([
                'message' => 'You cannot deactivate your own account.',
            ], 422);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'User is already inactive.',
            ], 422);
        }

        DB::transaction(function () use ($user, $actorId) {
            $user->update(['is_active' => false]);

            $this->audit->log(
                action: 'user.deactivated',
                module: 'users',
                companyId: $user->company_id,
                userId: $actorId,
                entityType: User::class,
                entityId: $user->id,
                oldValues: ['is_active' => true],
                newValues: ['is_active' => false],
            );
        });

        return response()->json([
            'data'    => $user->fresh(['company', 'roles']),
            'message' => 'User deactivated.',
        ]);
    }

    // ---------------------------------------------------------------------
    // ACTIVATE
    // ---------------------------------------------------------------------

    public function activate(User $user): JsonResponse
    {
        $actorId = (int) auth()->id();

        if ($user->isSuperAdmin()) {
            return response()->json([
                'message' => 'The Super Admin account is always active.',
            ], 403);
        }

        if ($user->is_active) {
            return response()->json([
                'message' => 'User is already active.',
            ], 422);
        }

        DB::transaction(function () use ($user, $actorId) {
            $user->update(['is_active' => true]);

            $this->audit->log(
                action: 'user.activated',
                module: 'users',
                companyId: $user->company_id,
                userId: $actorId,
                entityType: User::class,
                entityId: $user->id,
                oldValues: ['is_active' => false],
                newValues: ['is_active' => true],
            );
        });

        return response()->json([
            'data'    => $user->fresh(['company', 'roles']),
            'message' => 'User activated.',
        ]);
    }

    // ---------------------------------------------------------------------
    // LINK ERPNEXT — establish or refresh the ERPNext link for a user
    // ---------------------------------------------------------------------

    public function linkErpNext(LinkErpNextRequest $request, User $user): JsonResponse
    {
        if ($user->isSuperAdmin()) {
            return response()->json([
                'message' => 'The Super Admin account does not use ERPNext linking.',
            ], 403);
        }

        $data    = $request->validated();
        $actorId = (int) auth()->id();

        try {
            DB::transaction(function () use ($user, $data, $actorId) {
                $this->erp->provisionUser(
                    $user,
                    $data['erpnext_user'],
                    $data['erpnext_password'],
                );

                $this->audit->log(
                    action: $user->erpnext_token ? 'user.erpnext_relinked' : 'user.erpnext_linked',
                    module: 'users',
                    companyId: $user->company_id,
                    userId: $actorId,
                    entityType: User::class,
                    entityId: $user->id,
                    newValues: [
                        'erpnext_user' => $data['erpnext_user'],
                        'linked_at'    => now()->toIso8601String(),
                    ],
                );
            });
        } catch (ErpNextException $e) {
            $this->erp->clearLink($user, $e->getMessage());

            return response()->json([
                'message' => 'ERPNext link failed: ' . $e->getMessage(),
                'errors'  => ['erpnext_user' => [$e->getMessage()]],
            ], 422);
        } catch (\RuntimeException $e) {
            $this->erp->clearLink($user, $e->getMessage());

            return response()->json([
                'message' => $e->getMessage(),
                'errors'  => ['erpnext_user' => [$e->getMessage()]],
            ], 422);
        }

        $user->load([
            'company',
            'companies',
            'roles',
            'tillOperation',
            'tillOperation.accounts',
        ]);

        return response()->json([
            'data'    => $user,
            'message' => 'ERPNext link established.',
        ]);
    }

    // ---------------------------------------------------------------------
    // UNLINK ERPNEXT — remove the ERPNext association
    // ---------------------------------------------------------------------

    public function unlinkErpNext(User $user): JsonResponse
    {
        if ($user->isSuperAdmin()) {
            return response()->json([
                'message' => 'The Super Admin account does not use ERPNext linking.',
            ], 403);
        }

        if (! $user->erpnext_user && ! $user->erpnext_token) {
            return response()->json([
                'message' => 'This user is not linked to ERPNext.',
            ], 422);
        }

        $actorId = (int) auth()->id();

        DB::transaction(function () use ($user, $actorId) {
            $previousErpUser = $user->erpnext_user;

            // 1. Null the link fields on the user
            $user->forceFill([
                'erpnext_user'           => null,
                'erpnext_token'          => null,
                'erpnext_last_error'     => null,
                'erpnext_last_tested_at' => null,
            ])->save();

            // 2. Remove the till operation for this user
            if ($user->tillOperation) {
                $user->tillOperation->accounts()->detach();
                $user->tillOperation->delete();
            }

            // 3. Audit
            $this->audit->log(
                action: 'user.erpnext_unlinked',
                module: 'users',
                companyId: $user->company_id,
                userId: $actorId,
                entityType: User::class,
                entityId: $user->id,
                oldValues: ['erpnext_user' => $previousErpUser],
                newValues: ['erpnext_user' => null],
            );
        });

        $user->load(['company', 'companies', 'roles', 'tillOperation']);

        return response()->json([
            'data'    => $user,
            'message' => 'ERPNext link removed.',
        ]);
    }


    public function updateTill(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'till_no' => [
                'required',
                'integer',
                'min:1',
                'max:100',
                Rule::unique('till_operations', 'till_no')
                    ->where('company_id', $user->company_id)
                    ->ignore($user->tillOperation?->id)
            ],
            'price_list_id' => 'required|exists:price_lists,id',
            'shop_name' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:1000',
            'phone' => 'nullable|string|max:50',
            'is_online' => 'required|boolean',
            'allow_rate' => 'required|boolean',
            'return_pin' => 'nullable|integer|min:1000|max:9999',
        ]);

        $till = $user->tillOperation;
        if (!$till) {
            return response()->json(['message' => 'User does not have a till operation.'], 404);
        }

        $till->update([
            'till_no' => $request->till_no,
            'price_list_id' => $request->price_list_id,
            'shop_name' => $request->shop_name,
            'address' => $request->address,
            'phone' => $request->phone,
            'is_online' => $request->is_online,
            'allow_rate' => $request->allow_rate,
            'return_pin' => $request->return_pin,
        ]);

        // Reload the relations using the $user variable
        $user->load([
            'tillOperation.priceList',
            'tillOperation.accounts'
        ]);

        // Unhide the return_pin so the UI can see it
        if ($user->tillOperation) {
            $user->tillOperation->makeVisible('return_pin');
        }

        return response()->json([
            'message' => 'Till operation updated.',
            'data' => $user,
        ]);
    }
}
