
import { PrismaClient } from "@prisma/client";
import InventoryClient from "./InventoryClient";

const prisma = new PrismaClient();

async function getProducts() {
    return await prisma.product.findMany({
        orderBy: {
            updatedAt: 'desc'
        }
    });
}

export default async function InventoryPage() {
    const products = await getProducts();

    return <InventoryClient initialProducts={products} />;
}
