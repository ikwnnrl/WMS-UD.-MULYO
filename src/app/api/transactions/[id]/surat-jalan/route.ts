import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import path from "path";
import prisma from "@/lib/prisma";
import { SuratJalanPdf } from "@/components/pdf/SuratJalanPdf";

const LOGO_PATH = path.join(process.cwd(), "public", "logo-bml.png");

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const transactionId = parseInt(id);

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { product: true, customer: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    const tanggal = new Date(transaction.date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const pdfBuffer = await renderToBuffer(
      React.createElement(SuratJalanPdf, {
        noSuratJalan: transaction.suratJalanNumber || "-",
        noPO: transaction.poNumber || "-",
        noPolisi: transaction.licensePlate || "-",
        tanggal,
        namaPelanggan: transaction.customer?.name || "-",
        alamatPelanggan: transaction.customer?.address || "-",
        items: [
          {
            unit: Math.round(transaction.quantity),
            namaBarang: transaction.product.name,
            beratKg: transaction.quantity.toLocaleString("id-ID"),
          },
        ],
        logoUrl: LOGO_PATH,
      })
    );

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="SuratJalan_${transaction.suratJalanNumber?.replace(/\//g, "-") || transactionId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Surat Jalan PDF Error:", error);
    return NextResponse.json({ error: "Gagal membuat PDF Surat Jalan" }, { status: 500 });
  }
}
