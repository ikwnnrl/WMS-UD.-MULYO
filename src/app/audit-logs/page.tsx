
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ShieldAlert, Search } from "lucide-react";
import Link from "next/link";

export default async function AuditLogsPage() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("wms_session");

    if (!sessionCookie) redirect("/login");

    const session = JSON.parse(sessionCookie.value);
    if (session.role !== "OWNER") redirect("/");

    const logs = await prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 100
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <ShieldAlert className="text-red-600" />
                    Audit Trail (Rekam Jejak)
                </h1>
                <p className="text-slate-500 dark:text-slate-400">Memantau aktivitas sensitif sistem.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4">Waktu</th>
                                <th className="px-6 py-4">Aktor</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Aksi</th>
                                <th className="px-6 py-4">Entitas</th>
                                <th className="px-6 py-4">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-500">
                                        {new Date(log.timestamp).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                                        {log.actorName}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${log.actorRole === 'OWNER' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {log.actorRole}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold">
                                        <span className={
                                            log.action === 'DELETE' ? 'text-red-600' :
                                                log.action === 'UPDATE' ? 'text-blue-600' :
                                                    log.action === 'CREATE' ? 'text-green-600' : 'text-slate-600'
                                        }>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                        {log.entity} #{log.entityId}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs font-mono max-w-xs truncate" title={log.details || ''}>
                                        {log.details}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
