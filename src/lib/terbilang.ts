/**
 * Convert a Rupiah amount into its Indonesian words representation,
 * mirroring the VBA `TerbilangRupiah` function used in the original
 * Excel template (Template_Surat Jalan dan Invoice_CV_BML FIX.xlsm).
 *
 * Example: terbilangRupiah(4500000) -> "Empat Juta Lima Ratus Ribu Rupiah"
 */

const SATUAN = [
  "", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan",
  "Sepuluh", "Sebelas",
];

function angkaToWords(n: number): string {
  n = Math.floor(n);
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${angkaToWords(n - 10)} Belas`.trim();
  if (n < 100) {
    const puluh = Math.floor(n / 10);
    const sisa = n % 10;
    return `${angkaToWords(puluh)} Puluh${sisa ? " " + angkaToWords(sisa) : ""}`.trim();
  }
  if (n < 200) {
    const sisa = n - 100;
    return `Seratus${sisa ? " " + angkaToWords(sisa) : ""}`.trim();
  }
  if (n < 1000) {
    const ratus = Math.floor(n / 100);
    const sisa = n % 100;
    return `${angkaToWords(ratus)} Ratus${sisa ? " " + angkaToWords(sisa) : ""}`.trim();
  }
  if (n < 2000) {
    const sisa = n - 1000;
    return `Seribu${sisa ? " " + angkaToWords(sisa) : ""}`.trim();
  }
  if (n < 1000000) {
    const ribu = Math.floor(n / 1000);
    const sisa = n % 1000;
    return `${angkaToWords(ribu)} Ribu${sisa ? " " + angkaToWords(sisa) : ""}`.trim();
  }
  if (n < 1000000000) {
    const juta = Math.floor(n / 1000000);
    const sisa = n % 1000000;
    return `${angkaToWords(juta)} Juta${sisa ? " " + angkaToWords(sisa) : ""}`.trim();
  }
  if (n < 1000000000000) {
    const milyar = Math.floor(n / 1000000000);
    const sisa = n % 1000000000;
    return `${angkaToWords(milyar)} Milyar${sisa ? " " + angkaToWords(sisa) : ""}`.trim();
  }
  const triliun = Math.floor(n / 1000000000000);
  const sisa = n % 1000000000000;
  return `${angkaToWords(triliun)} Triliun${sisa ? " " + angkaToWords(sisa) : ""}`.trim();
}

export function terbilangRupiah(amount: number): string {
  if (!amount || isNaN(amount)) return "Nol Rupiah";
  const rounded = Math.round(amount);
  if (rounded === 0) return "Nol Rupiah";
  const words = angkaToWords(Math.abs(rounded));
  const prefix = rounded < 0 ? "Minus " : "";
  return `${prefix}${words} Rupiah`.replace(/\s+/g, " ").trim();
}
