<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\PriceListResource;
use App\Models\PriceList;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PriceListController extends Controller
{
    private const COUNTS = [
        'itemPrices',
        'tillOperations',
    ];

    // Picker — active selling price lists, any authed user
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = PriceList::query()
            ->active()
            ->selling()
            ->orderBy('name');

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('erpnext_name', 'like', "%{$search}%");
            });
        }

        return PriceListResource::collection($query->limit(100)->get());
    }

    // Admin list — all price lists + counts, SA only
    public function listAll(Request $request): AnonymousResourceCollection
    {
        $this->authorizeSuperAdmin($request);

        $priceLists = PriceList::query()
            ->withCount(self::COUNTS)
            ->orderBy('name')
            ->get();

        return PriceListResource::collection($priceLists);
    }

    // Show — single price list + counts, SA only
    public function show(Request $request, PriceList $priceList): PriceListResource
    {
        $this->authorizeSuperAdmin($request);

        $priceList->loadCount(self::COUNTS);

        return new PriceListResource($priceList);
    }

    private function authorizeSuperAdmin(Request $request): void
    {
        $user = $request->user();

        if (! $user || ! $user->isSuperAdmin()) {
            abort(403, 'You do not have permission to access price lists.');
        }
    }
}
