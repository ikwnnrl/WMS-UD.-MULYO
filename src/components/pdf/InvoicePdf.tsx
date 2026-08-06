import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { terbilangRupiah } from "@/lib/terbilang";

// Replikasi sheet "INVOICE" print area B2:G29.
// Spec section 3: A4 portrait, dicetak 2x per lembar (atas/bawah via RunInvoiceHalf).
// Di web: 1 PDF = 1 half-A4 (210 x 148.5mm).
const PAGE_WIDTH = 210 * 2.8346; // A4 width
const PAGE_HEIGHT = 148.5 * 2.8346; // half A4 height

// Proporsi kolom dari lebar kolom Excel (B/C/D/E/F+G):
// No 11% | Nama 20% | Kuantitas 14% | Harga 16% | Jumlah 39%
const W_NO = "11%";
const W_NAMA = "20%";
const W_KUANT = "14%";
const W_HARGA = "16%";
const W_JUMLAH = "39%";

const styles = StyleSheet.create({
  page: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 14,
    paddingRight: 12,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  companyBlock: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  // Logo spec section 2: ~30.6 x 44.8pt (portrait, ratio 0.68)
  logo: { width: 24, height: 35 },
  companyName: { fontSize: 12, fontWeight: 700 },
  companyDetail: { fontSize: 9 },
  invoiceTitle: { fontSize: 22, fontWeight: 700 },
  section: { marginTop: 6 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, marginBottom: 4 },
  infoLeft: { width: "48%" },
  infoRight: { width: "48%" },
  pelangganLabel: { fontSize: 10, fontWeight: 700, marginBottom: 1 },
  infoLine: { flexDirection: "row", marginBottom: 1 },
  infoLabel: { width: 78, fontSize: 9 },
  infoValue: { fontSize: 9, fontWeight: 700, flex: 1 },
  table: { marginTop: 6 },
  // Border thin continuous seluruh tabel B14:G19
  tableHeaderRow: {
    flexDirection: "row",
    borderTopWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: "#000",
    paddingVertical: 3,
  },
  tableHeaderCell: { fontSize: 9, fontWeight: 700, textAlign: "center" },
  tableRow: { flexDirection: "row", paddingVertical: 4, minHeight: 16 },
  colNo: { width: W_NO, textAlign: "center" },
  colNama: { width: W_NAMA, textAlign: "center" },
  colKuantitas: { width: W_KUANT, textAlign: "center" },
  colHarga: { width: W_HARGA, textAlign: "center" },
  colJumlah: { width: W_JUMLAH, textAlign: "right", paddingRight: 4 },
  tableCell: { fontSize: 9 },
  totalsBlock: { marginTop: 2 },
  // Label LEFT, value RIGHT (mirror Excel B17:E17 left, F17:G17 right)
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 1, borderTopWidth: 0 },
  totalRowFirst: { borderTopWidth: 0.75, borderColor: "#000", paddingTop: 2 },
  totalLabel: { width: "61%", textAlign: "left", fontSize: 9 },
  totalValue: { width: "39%", textAlign: "right", fontSize: 9, paddingRight: 4 },
  // TOTAL AKHIR: border thick atas+bawah, bold (spec section 2 "Border emphasis")
  grandTotalRow: { borderBottomWidth: 1.5, borderColor: "#000", paddingBottom: 2, borderTopWidth: 1.5 },
  terbilang: { marginTop: 5, fontSize: 8, fontStyle: "italic" },
  footer: { marginTop: 8 },
  footerTitle: { fontSize: 8, fontWeight: 700 },
  footerText: { fontSize: 8 },
  signatureBlock: { marginTop: 10, alignItems: "flex-end" },
  signatureLabel: { fontSize: 11, textAlign: "center" },
  signatureCompany: { marginTop: 26, fontSize: 11, fontWeight: 700, textAlign: "center" },
});

export interface InvoicePdfProps {
  invoiceNumber: string;
  suratJalanNumber: string;
  tanggal: string; // "dd.mm.yyyy"
  namaPelanggan: string;
  alamatPelanggan: string;
  npwpPelanggan?: string;
  itemName: string;
  quantity: number;
  pricePerKg: number;
  subtotal: number;
  ppn: number;
  total: number;
  logoUrl?: string;
}

// Format mirror Excel number format:
// - Kuantitas: #.##0" Kg"  → "6.000 Kg"
// - Harga: "Rp "#,##0      → "Rp 4.350"
// - Jumlah: "Rp "#,##0
function formatKg(n: number) {
  return `${n.toLocaleString("id-ID")} Kg`;
}
function formatRupiah(n: number) {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

export function InvoicePdf({
  invoiceNumber,
  suratJalanNumber,
  tanggal,
  namaPelanggan,
  alamatPelanggan,
  npwpPelanggan,
  itemName,
  quantity,
  pricePerKg,
  subtotal,
  ppn,
  total,
  logoUrl,
}: InvoicePdfProps) {
  return (
    <Document>
      <Page size={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }} style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.companyBlock}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            <View>
              <Text style={styles.companyName}>CV. BUMI MULIA LESTARI</Text>
              <Text style={styles.companyDetail}>Jl. Lingkar Slawi - Kab. Tegal</Text>
              <Text style={styles.companyDetail}>Telp. 0853 2621 5550</Text>
              <Text style={styles.companyDetail}>NPWP : 1000 0000 1028 6735</Text>
            </View>
          </View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Text style={styles.pelangganLabel}>PELANGGAN</Text>
            <Text style={styles.infoValue}>{namaPelanggan}</Text>
            <Text style={{ fontSize: 9 }}>{alamatPelanggan}</Text>
            <Text style={{ fontSize: 9 }}>NPWP : {npwpPelanggan || "0810 9774 0550 1000"}</Text>
          </View>
          <View style={styles.infoRight}>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>No. Invoice</Text>
              <Text style={styles.infoValue}>: {invoiceNumber}</Text>
            </View>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>No. Surat Jalan</Text>
              <Text style={styles.infoValue}>: {suratJalanNumber}</Text>
            </View>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>Tanggal</Text>
              <Text style={styles.infoValue}>: {tanggal}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.section, { fontSize: 8 }]}>Rincian tagihan:</Text>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colNo]}>No</Text>
            <Text style={[styles.tableHeaderCell, styles.colNama]}>Nama Barang</Text>
            <Text style={[styles.tableHeaderCell, styles.colKuantitas]}>Kuantitas (Kg)</Text>
            <Text style={[styles.tableHeaderCell, styles.colHarga]}>Harga/Kg (Rp)</Text>
            <Text style={[styles.tableHeaderCell, styles.colJumlah]}>Jumlah (Rp)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colNo]}>1</Text>
            <Text style={[styles.tableCell, styles.colNama]}>{itemName}</Text>
            <Text style={[styles.tableCell, styles.colKuantitas]}>{formatKg(quantity)}</Text>
            <Text style={[styles.tableCell, styles.colHarga]}>{formatRupiah(pricePerKg)}</Text>
            <Text style={[styles.tableCell, styles.colJumlah]}>{formatRupiah(subtotal)}</Text>
          </View>
        </View>

        <View style={styles.totalsBlock}>
          <View style={[styles.totalRow, styles.totalRowFirst]}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatRupiah(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>PPN 11%</Text>
            <Text style={styles.totalValue}>{formatRupiah(ppn)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={[styles.totalLabel, { fontWeight: 700 }]}>TOTAL AKHIR</Text>
            <Text style={[styles.totalValue, { fontWeight: 700 }]}>{formatRupiah(total)}</Text>
          </View>
        </View>

        <Text style={styles.terbilang}>Terbilang: {terbilangRupiah(total)}</Text>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>KETERANGAN PEMBAYARAN</Text>
          <Text style={styles.footerText}>Pembayaran harus ditujukan kepada CV. BUMI MULIA LESTARI.</Text>
          <Text style={styles.footerText}>BANK BRI | No. Rekening: 066101001608564 | A/N: CV. BUMI MULIA LESTARI</Text>
        </View>

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLabel}>Hormat kami,</Text>
          <Text style={styles.signatureCompany}>CV. BUMI MULIA LESTARI</Text>
        </View>
      </Page>
    </Document>
  );
}
