"use client";

import dynamic from "next/dynamic";

const ProductionTrendChart = dynamic(
    () => import("./ProductionTrendChart"),
    { ssr: false, loading: () => <div className="h-[300px] w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" /> }
);

export default ProductionTrendChart;
