import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import Select from './Select';
import type { Company } from '../types';

interface Props {
  search: string;
  status: 'all' | 'active' | 'inactive';
  companyId: number | 'all';
  companies: Company[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: 'all' | 'active' | 'inactive') => void;
  onCompanyChange: (value: number | 'all') => void;
}

export default function UsersFilters({
  search,
  status,
  companyId,
  companies,
  onSearchChange,
  onStatusChange,
  onCompanyChange,
}: Props) {
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== search) onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(t);
  }, [localSearch, search, onSearchChange]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search by name, username, email..."
          className="pl-9"
        />
      </div>

      <Select
        value={status}
        onChange={onStatusChange}
        triggerClassName="min-w-[150px]"
        options={[
          { value: 'all', label: 'All statuses' },
          { value: 'active', label: 'Active only' },
          { value: 'inactive', label: 'Inactive only' },
        ]}
      />

      <Select
        value={companyId}
        onChange={onCompanyChange}
        triggerClassName="min-w-[160px]"
        options={[
          { value: 'all' as number | 'all', label: 'All companies' },
          ...companies.map((c) => ({ value: c.id as number | 'all', label: c.name })),
        ]}
      />
    </div>
  );
}