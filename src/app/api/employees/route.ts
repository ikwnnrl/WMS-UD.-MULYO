
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PREDEFINED_EMPLOYEES = [
    "Rinto", "Bambang", "Sono", "Ali", "Sikin", "Sahrudin", "Hisam", "Wiwin",
    "Taqim", "Feri", "Tamrin", "Amar", "Amir", "Kiki", "Wandi", "Saeful", "Zein", "Sapoon"
];

export async function GET() {
    try {
        let employees = await prisma.employee.findMany();

        if (employees.length === 0) {
            // Seed initial data
            await prisma.employee.createMany({
                data: PREDEFINED_EMPLOYEES.map(name => ({ name }))
            });
            employees = await prisma.employee.findMany();
        }

        return NextResponse.json(employees);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
    }
}
