import prisma from "@/lib/prisma";

/**
 * Atomically increments and returns the next counter value for a document
 * type ('SURAT_JALAN' or 'INVOICE'), mirroring MASTER!I5 / MASTER!I8 in the
 * original Excel template. Creates the counter row on first use.
 */
export async function nextCounterValue(docType: "SURAT_JALAN" | "INVOICE"): Promise<number> {
  const counter = await prisma.documentCounter.upsert({
    where: { docType },
    update: { currentValue: { increment: 1 } },
    create: { docType, currentValue: 1 },
  });
  return counter.currentValue;
}

/**
 * Format the Surat Jalan number: {00000}/{KodeBarang}/{GudangTujuan}
 * e.g. "00036/ONG/M3" — mirrors the formula in Surat Jalan!D7.
 */
export function formatSuratJalanNumber(counterValue: number, kodeBarang: string, gudangTujuan: string): string {
  const nomor = String(counterValue).padStart(5, "0");
  return `${nomor}/${kodeBarang || "-"}/${gudangTujuan || "-"}`;
}

/**
 * Format the Invoice number: INV-{00000} — mirrors INVOICE!G7.
 */
export function formatInvoiceNumber(counterValue: number): string {
  return `INV-${String(counterValue).padStart(5, "0")}`;
}

/**
 * Format the PO number: PO/{000}/MLB/{00}/{RomanMonth}/{yy}
 * e.g. "PO/002/MLB/25/VIII/26" — mirrors Surat Jalan!D8.
 * poDigit3: 3-digit sequence number, poDigit2: 2-digit sequence number.
 */
const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function formatPoNumber(poDigit3: number, poDigit2: number, date: Date): string {
  const month = ROMAN_MONTHS[date.getMonth()];
  const yy = String(date.getFullYear()).slice(-2);
  return `PO/${String(poDigit3).padStart(3, "0")}/MLB/${String(poDigit2).padStart(2, "0")}/${month}/${yy}`;
}
