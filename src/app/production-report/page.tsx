
import { cookies } from "next/headers";
import ProductionReportClient from "./ProductionReportClient";

export default async function ProductionReportPage() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("wms_session");

    let userRole = "";

    if (sessionCookie) {
        try {
            const session = JSON.parse(sessionCookie.value);
            userRole = session.role || "";
        } catch (e) {
            console.error("Failed to parse session", e);
        }
    }

    return <ProductionReportClient userRole={userRole} />;
}
