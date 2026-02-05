
"use client";

import { Download } from "lucide-react";
import * as XLSX from "xlsx";

interface ExportButtonProps {
    data: any[];
    filename?: string;
    label?: string;
    className?: string;
}

export default function ExportButton({ data, filename = "data", label = "Export Excel", className }: ExportButtonProps) {
    const handleExport = () => {
        if (!data || data.length === 0) {
            alert("Tidak ada data untuk diexport");
            return;
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    return (
        <button
            onClick={handleExport}
            className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm font-medium text-sm ${className}`}
        >
            <Download size={16} />
            {label}
        </button>
    );
}
