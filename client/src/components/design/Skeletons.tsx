import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonTechnicianCard() {
    return (
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-border/50 flex gap-4 items-center">
            <Skeleton className="w-20 h-20 rounded-2xl" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2 mt-2">
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <Skeleton className="h-6 w-16 rounded-md" />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
        </div>
    );
}

export function SkeletonServiceCard() {
    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
            <div className="flex justify-between mb-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-12 h-6 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/4 mb-4" />
            <div className="flex gap-3 mb-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="w-6 h-6 rounded-full" />
            </div>
        </div>
    );
}
