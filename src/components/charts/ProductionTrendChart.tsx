
"use client";

import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

interface ProductionTrendChartProps {
    data: any[];
}

export default function ProductionTrendChart({ data }: ProductionTrendChartProps) {
    return (
        <div className="h-[300px] w-full bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Tren Produksi & Solar</h3>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 20,
                    }}
                >
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis
                        dataKey="date"
                        scale="band"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Tepung (Kg)', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#64748b' }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Solar (L)', angle: 90, position: 'insideRight', fontSize: 12, fill: '#64748b' }}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="tepung" name="Tepung (Kg)" barSize={20} fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="solar" name="Solar (L)" stroke="#ea580c" strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
