
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashPin } from "@/lib/auth";

const prisma = new PrismaClient();

const PREDEFINED_EMPLOYEES = [
    "Rinto", "Bambang", "Sono", "Ali", "Sikin", "Sahrudin", "Hisam", "Wiwin",
    "Taqim", "Feri", "Tamrin", "Amar", "Amir", "Kiki", "Wandi", "Saeful", "Zein", "Sapoon"
];

export async function GET() {
    try {
        let employees = await prisma.employee.findMany();

        if (employees.length === 0) {
            // Seed initial data with a hashed default PIN (not plaintext "000000")
            const defaultPinHash = await hashPin("000000");
            await prisma.employee.createMany({
                data: PREDEFINED_EMPLOYEES.map(name => ({ name, pin: defaultPinHash }))
            });
            employees = await prisma.employee.findMany();
        }

        // This endpoint is public (used by the login page to render the staff
        // picker before authentication), so never leak PIN hashes or other
        // sensitive fields here — only what the picker UI needs.
        const safeEmployees = employees.map(({ id, name, isActive }) => ({ id, name, isActive }));

        return NextResponse.json(safeEmployees);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
    }
}
