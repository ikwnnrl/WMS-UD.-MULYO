import { cookies } from "next/headers";
import AttendanceClient from "./AttendanceClient";

export default async function Page() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("wms_session");

    let userRole = "STAFF";

    if (sessionCookie?.value) {
        try {
            const parsed = JSON.parse(sessionCookie.value);
            userRole = parsed.role || "STAFF";
        } catch (e) {
            console.error("Failed to parse session", e);
        }
    }

    return <AttendanceClient userRole={userRole} />;
}
