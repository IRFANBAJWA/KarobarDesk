<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ModelsSmokeTest extends Command
{
    protected $signature = 'models:smoke
                            {--models= : Comma-separated list of model class names to check (default: all)}
                            {--json : Output JSON}';

    protected $description = 'Smoke test all Eloquent models against the live schema';

    /**
     * The canonical list of every KarobarDesk model.
     * Order matches the migration order in the locked context doc.
     *
     * @var array<int, string>
     */
    protected array $allModels = [
        // Module 1 — Auth & access
        'Company',
        'User',
        'Role',
        'Permission',
        'RolePermission',
        'FieldPermission',
        'UserRole',
        'UserCompanyAccess',

        // Module 2 — ERPNext masters
        'PriceList',
        'Item',
        'ItemPrice',
        'Customer',
        'Account',
        'TillOperation',
        'TillOperationAccount',

        // Module 3 — Stock
        'ItemStock',
        'StockLedger',
        'RejectedSale',
        'RejectedSaleItem',
        'RejectedSalePayment',

        // Module 4 — Sales
        'SalesInvoice',
        'SalesInvoiceItem',
        'Payment',

        // Module 5 — POS operations
        'Shift',
        'ShiftDenomination',
        'DayClosing',
        'JournalEntry',
        'JournalEntryAccount',

        // Module 6 — Purchasing
        'PurchaseOrder',
        'PurchaseOrderItem',
        'PurchaseReceipt',
        'PurchaseReceiptItem',

        // Module 7 — Courier
        'CourierPartner',
        'CourierAccount',
        'CourierLocation',
        'CourierCity',
        'Parcel',
        'ParcelStatusHistory',
        'ParcelAdvice',
        'CourierSyncLog',
        'ParcelSettlement',
        'ParcelSettlementImport',

        // Module 8 — Sync / Audit / Config
        'WebhookEvent',
        'SyncLog',
        'AuditLog',
        'SystemSetting',

        // Module 9 — Stock Audit
        'CompanyItemStatus',
        'StockAudit',
        'StockAuditItem',
        'StockAuditCount',
        'StockAuditVerification',
    ];

    public function handle(): int
    {
        $models = $this->resolveModelList();
        $results = [];

        foreach ($models as $name) {
            $results[] = $this->checkModel($name);
        }

        if ($this->option('json')) {
            $this->line(json_encode($results, JSON_PRETTY_PRINT));

            return $this->exitCode($results);
        }

        $this->renderHuman($results);

        return $this->exitCode($results);
    }

    /**
     * @return array<int, string>
     */
    protected function resolveModelList(): array
    {
        $option = $this->option('models');

        if ($option === null || $option === '') {
            return $this->allModels;
        }

        return array_map('trim', explode(',', $option));
    }

    /**
     * @return array{model:string, class:string, table:?string, count:?int, status:string, error:?string}
     */
    protected function checkModel(string $shortName): array
    {
        $class = "App\\Models\\{$shortName}";

        if (! class_exists($class)) {
            return [
                'model'  => $shortName,
                'class'  => $class,
                'table'  => null,
                'count'  => null,
                'status' => 'FAIL',
                'error'  => "Class {$class} not found",
            ];
        }

        try {
            $instance = new $class;
            $table = $instance->getTable();

            if (! Schema::hasTable($table)) {
                return [
                    'model'  => $shortName,
                    'class'  => $class,
                    'table'  => $table,
                    'count'  => null,
                    'status' => 'FAIL',
                    'error'  => "Table '{$table}' does not exist",
                ];
            }

            // Verify every $fillable column exists on the table.
            $columns = Schema::getColumnListing($table);
            $fillable = $instance->getFillable();
            $missing = array_diff($fillable, $columns);

            if (! empty($missing)) {
                return [
                    'model'  => $shortName,
                    'class'  => $class,
                    'table'  => $table,
                    'count'  => null,
                    'status' => 'FAIL',
                    'error'  => "Missing columns: " . implode(', ', $missing),
                ];
            }

            // Verify the model can actually query the table.
            $count = $class::query()->count();

            return [
                'model'  => $shortName,
                'class'  => $class,
                'table'  => $table,
                'count'  => $count,
                'status' => 'OK',
                'error'  => null,
            ];
        } catch (\Throwable $e) {
            return [
                'model'  => $shortName,
                'class'  => $class,
                'table'  => null,
                'count'  => null,
                'status' => 'FAIL',
                'error'  => $e->getMessage(),
            ];
        }
    }

    /**
     * @param array<int, array{model:string, class:string, table:?string, count:?int, status:string, error:?string}> $results
     */
    protected function renderHuman(array $results): void
    {
        $this->newLine();
        $this->line('<options=bold>KarobarDesk — Model smoke test</>');
        $this->line('──────────────────────────────');
        $this->newLine();

        $passed = 0;
        $failed = 0;

        foreach ($results as $r) {
            if ($r['status'] === 'OK') {
                $passed++;
                $dots = str_repeat('.', max(2, 36 - strlen($r['model'])));
                $this->line(sprintf(
                    '  <fg=green>%s</> %s <fg=green>OK</>  <fg=gray>(%d rows)</>',
                    $r['model'],
                    $dots,
                    $r['count']
                ));
            } else {
                $failed++;
                $this->line(sprintf('  <fg=red>%s</>  <fg=red>FAIL</>', $r['model']));
                $this->line('     <fg=red>' . $r['error'] . '</>');
            }
        }

        $this->newLine();
        $this->line('──────────────────────────────');

        if ($failed === 0) {
            $this->line(sprintf('<fg=green;options=bold>%d/%d models OK</>', $passed, count($results)));
        } else {
            $this->line(sprintf(
                '<fg=yellow>%d passed</>, <fg=red>%d failed</> (out of %d)',
                $passed,
                $failed,
                count($results)
            ));
        }

        $this->newLine();
    }

    /**
     * @param array<int, array{status:string}> $results
     */
    protected function exitCode(array $results): int
    {
        foreach ($results as $r) {
            if ($r['status'] !== 'OK') {
                return self::FAILURE;
            }
        }

        return self::SUCCESS;
    }
}
