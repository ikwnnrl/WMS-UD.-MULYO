import { Skeleton } from "@/components/ui/skeleton";
import { Package, Search } from "lucide-react";

export default function Loading() {
    return (
        <div className="space-y-8 pb-20 fade-in">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600/10 rounded-xl">
                            <Skeleton className="h-6 w-6 bg-indigo-200 dark:bg-indigo-900" />
                        </div>
                        <Skeleton className="h-8 w-48" />
                    </div>
                    <Skeleton className="h-4 w-64 mt-2" />
                </div>
                <Skeleton className="h-10 w-32 rounded-xl" />
            </div>

            {/* Search & Filter Skeleton */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="glass-card flex-1 flex items-center gap-4 py-2 px-4 h-12">
                    <Search className="text-slate-300" size={20} />
                    <Skeleton className="h-4 flex-1" />
                </div>
                <div className="glass-card p-1 flex gap-1 h-12 w-full md:w-auto items-center">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-8 w-20 rounded-lg" />
                    ))}
                </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="glass-card h-[220px] flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <Skeleton className="h-16 rounded-xl" />
                            <Skeleton className="h-16 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
