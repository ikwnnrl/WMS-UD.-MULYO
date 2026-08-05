import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { terbilangRupiah } from "@/lib/terbilang";

// Invoice sheet in Excel is portrait A4, but content (B2:G29) is designed to be
// printed twice per A4 sheet (top half / bottom half) via the RunInvoiceHalf("atas"/"bawah")
// macro — i.e. half-A4 per copy (~210 x 148.5mm), not the custom continuous-form
// size used by Surat Jalan.
const PAGE_WIDTH = 210 * 2.8346; // A4 width in points
const PAGE_HEIGHT = 148.5 * 2.8346; // half A4 height in points

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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  companyBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  logo: {
    width: 30,
    height: 30,
  },
  companyName: {
    fontSize: 12,
    fontWeight: 700,
  },
  companyDetail: {
    fontSize: 9,
  },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: 700,
  },
  section: {
    marginTop: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 4,
  },
  infoLeft: { width: "48%" },
  infoRight: { width: "48%" },
  pelangganLabel: { fontSize: 10, fontWeight: 700, marginBottom: 1 },
  infoLine: { flexDirection: "row", marginBottom: 1 },
  infoLabel: { width: 78, fontSize: 9 },
  infoValue: { fontSize: 9, fontWeight: 700, flex: 1 },
  table: {
    marginTop: 6,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderTopWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: "#000",
    paddingVertical: 3,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 700,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    minHeight: 16,
  },
  colNo: { width: "8%", textAlign: "center" },
  colNama: { width: "34%", textAlign: "center" },
  colKuantitas: { width: "20%", textAlign: "center" },
  colHarga: { width: "18%", textAlign: "center" },
  colJumlah: { width: "20%", textAlign: "center" },
  tableCell: { fontSize: 9 },
  totalsBlock: {
    marginTop: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 1,
    borderTopWidth: 0,
  },
  totalRowFirst: {
    borderTopWidth: 0.75,
    borderColor: "#000",
    paddingTop: 2,
  },
  totalLabel: { width: "28%", textAlign: "left", fontSize: 9 },
  totalValue: { width: "20%", textAlign: "center", fontSize: 9 },
  grandTotalRow: {
    borderBottomWidth: 0.75,
    borderColor: "#000",
    paddingBottom: 2,
  },
  terbilang: {
    marginTop: 5,
    fontSize: 8,
    fontStyle: "italic",
  },
  footer: {
    marginTop: 8,
  },
  footerTitle: {
    fontSize: 8,
    fontWeight: 700,
  },
  footerText: {
    fontSize: 8,
  },
  signatureBlock: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  signatureLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  signatureCompany: {
    marginTop: 26,
    fontSize: 11,
    fontWeight: 700,
    textAlign: "center",
  },
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
  const formatRupiah = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

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
            <Text style={[styles.tableCell, styles.colKuantitas]}>{quantity.toLocaleString("id-ID")}</Text>
            <Text style={[styles.tableCell, styles.colHarga]}>{pricePerKg.toLocaleString("id-ID")}</Text>
            <Text style={[styles.tableCell, styles.colJumlah]}>{subtotal.toLocaleString("id-ID")}</Text>
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
            <Text style={styles.totalLabel}>TOTAL AKHIR</Text>
            <Text style={styles.totalValue}>{formatRupiah(total)}</Text>
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
