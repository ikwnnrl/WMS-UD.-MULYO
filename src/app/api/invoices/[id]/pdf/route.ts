import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import path from "path";
import prisma from "@/lib/prisma";
import { InvoicePdf } from "@/components/pdf/InvoicePdf";

const LOGO_PATH = path.join(process.cwd(), "public", "logo-bml.png");

// GET /api/invoices/[id]/pdf — render an existing Invoice as a PDF.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, transaction: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }

    const tanggal = new Date(invoice.date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePdf, {
        invoiceNumber: invoice.invoiceNumber,
        suratJalanNumber: invoice.transaction?.suratJalanNumber || "-",
        tanggal,
        namaPelanggan: invoice.customer?.name || "-",
        alamatPelanggan: invoice.customer?.address || "-",
        npwpPelanggan: invoice.customer?.npwp || undefined,
        itemName: invoice.itemName || "-",
        quantity: invoice.quantity || 0,
        pricePerKg: invoice.pricePerKg || 0,
        subtotal: invoice.subtotal,
        ppn: invoice.ppn,
        total: invoice.total,
        logoUrl: LOGO_PATH,
      })
    );

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Invoice PDF Error:", error);
    return NextResponse.json({ error: "Gagal membuat PDF Invoice" }, { status: 500 });
  }
}
