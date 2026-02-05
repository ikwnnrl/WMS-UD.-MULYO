"use client";

import { useEffect, useState } from "react";

export default function CurrentDate() {
    const [date, setDate] = useState<string>("");

    useEffect(() => {
        setDate(new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    }, []);

    if (!date) return <span className="animate-pulse bg-slate-200 dark:bg-slate-800 h-4 w-32 rounded inline-block" />;

    return <>{date}</>;
}
