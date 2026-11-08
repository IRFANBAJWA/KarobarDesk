export default function DashboardSkeleton() {
    return (
        <div className="relative min-h-screen bg-transparent p-4 md:p-6 lg:p-8 space-y-6 pb-10 animate-pulse">
            
            {/* HEADER SKELETON */}
            <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                <div className="space-y-3">
                    <div className="h-4 w-32 bg-white/10 rounded-md" />
                    <div className="h-8 w-64 bg-white/10 rounded-lg" />
                    <div className="h-4 w-48 bg-white/5 rounded-md" />
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-32 bg-white/5 rounded-xl border border-white/5" />
                    <div className="h-10 w-32 bg-white/5 rounded-xl border border-white/5" />
                </div>
            </div>

            {/* KPI CARDS SKELETON (Row 1) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[160px] rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="h-4 w-24 bg-white/10 rounded-md" />
                            <div className="h-10 w-10 bg-white/10 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-8 w-32 bg-white/10 rounded-lg" />
                            <div className="h-3 w-full bg-white/5 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>

            {/* PRODUCT KPIS SKELETON (Row 2) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[140px] rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="h-4 w-24 bg-white/10 rounded-md" />
                            <div className="h-8 w-8 bg-white/10 rounded-lg" />
                        </div>
                        <div className="h-7 w-20 bg-white/10 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* CHART & HEALTH SKELETON (Row 3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[400px] rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                    <div className="h-6 w-40 bg-white/10 rounded-md mb-6" />
                    <div className="flex items-end h-[280px] gap-4">
                        {[40, 70, 45, 90, 60, 80, 100, 50].map((h, i) => (
                            <div key={i} className="flex-1 bg-white/5 rounded-t-md" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                </div>
                <div className="h-[400px] rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-6">
                    <div className="h-6 w-32 bg-white/10 rounded-md" />
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 rounded-xl bg-white/5 border border-white/5" />
                    ))}
                </div>
            </div>

            {/* TABLE SKELETON (Row 4) */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                <div className="h-6 w-48 bg-white/10 rounded-md mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between items-center">
                            <div className="h-10 w-48 bg-white/5 rounded-lg" />
                            <div className="h-8 w-24 bg-white/5 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}