import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { nextCounterValue, formatInvoiceNumber } from "@/lib/document-numbering";
import { createAuditLog } from "@/lib/audit";

// POST /api/transactions/[id]/invoice — create an Invoice record from a Transaction.
// Restricted to OWNER, mirroring the restriction already applied to
// cashflow/supplier/transaction edit-delete endpoints.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner();
  if (!session) {
    return NextResponse.json({ error: "Hanya OWNER yang dapat membuat invoice." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const transactionId = parseInt(id);
    const body = await request.json().catch(() => ({}));

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { product: true, customer: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    // Reuse an existing invoice for this transaction if one already exists,
    // instead of minting duplicate invoice numbers.
    const existing = await prisma.invoice.findFirst({ where: { transactionId } });
    if (existing) {
      return NextResponse.json(existing);
    }

    // Berat untuk Invoice bisa berbeda dari berat di Surat Jalan (transaction.quantity)
    // karena hasil timbang ulang biasanya mengalami susut. Jika tidak diisi manual,
    // fallback ke berat transaksi seperti sebelumnya.
    const invoiceWeight = body.actualWeight !== undefined && body.actualWeight !== null && !isNaN(parseFloat(body.actualWeight))
      ? parseFloat(body.actualWeight)
      : transaction.quantity;

    const pricePerKg = transaction.pricePerKg ?? transaction.product.pricePerKg ?? 0;
    const subtotal = invoiceWeight * pricePerKg;
    const ppn = Math.round(subtotal * 0.11);
    const total = subtotal + ppn;

    const counterValue = await nextCounterValue("INVOICE");
    const invoiceNumber = formatInvoiceNumber(counterValue);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        transactionId: transaction.id,
        customerId: transaction.customerId,
        date: transaction.date,
        itemName: transaction.product.name,
        quantity: invoiceWeight,
        pricePerKg,
        subtotal,
        ppn,
        total,
      },
    });

    await createAuditLog(
      "CREATE",
      "Invoice",
      invoice.id,
      `Invoice ${invoiceNumber} dibuat dari transaksi #${transaction.id}`,
      session
    );

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Create Invoice Error:", error);
    return NextResponse.json({ error: "Gagal membuat invoice" }, { status: 500 });
  }
}
