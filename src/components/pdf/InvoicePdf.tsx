import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { terbilangRupiah } from "@/lib/terbilang";

const PAGE_WIDTH = 241.3 * 2.8346;
const PAGE_HEIGHT = 139.7 * 2.8346;

const styles = StyleSheet.create({
  page: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    padding: 18,
    fontSize: 8,
    fontFamily: "Helvetica",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  companyBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  logo: {
    width: 28,
    height: 28,
  },
  companyName: {
    fontSize: 10,
    fontWeight: 700,
  },
  companyDetail: {
    fontSize: 7,
    color: "#333",
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: 700,
  },
  section: {
    marginTop: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  infoLeft: { width: "50%" },
  infoRight: { width: "45%" },
  infoLine: { flexDirection: "row", marginBottom: 1 },
  infoLabel: { width: 75 },
  table: {
    borderTopWidth: 1,
    borderTopColor: "#000",
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingVertical: 2,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 2,
  },
  colNo: { width: "6%" },
  colNama: { width: "34%" },
  colKuantitas: { width: "20%", textAlign: "right" },
  colHarga: { width: "20%", textAlign: "right" },
  colJumlah: { width: "20%", textAlign: "right" },
  totalsBlock: {
    marginTop: 6,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "50%",
    marginBottom: 1,
  },
  totalLabel: { width: "50%", textAlign: "right", paddingRight: 8 },
  totalValue: { width: "50%", textAlign: "right" },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#000",
    marginTop: 2,
    paddingTop: 2,
  },
  terbilang: {
    marginTop: 4,
    fontStyle: "italic",
  },
  footer: {
    marginTop: 10,
  },
  signatureBlock: {
    marginTop: 12,
    alignItems: "flex-end",
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
            <Text style={{ fontWeight: 700 }}>PELANGGAN</Text>
            <Text>{namaPelanggan}</Text>
            <Text>{alamatPelanggan}</Text>
            {npwpPelanggan && <Text>NPWP : {npwpPelanggan}</Text>}
          </View>
          <View style={styles.infoRight}>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>No. Invoice</Text>
              <Text>: {invoiceNumber}</Text>
            </View>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>No. Surat Jalan</Text>
              <Text>: {suratJalanNumber}</Text>
            </View>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>Tanggal</Text>
              <Text>: {tanggal}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.section}>Rincian tagihan:</Text>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colNo}>No</Text>
            <Text style={styles.colNama}>Nama Barang</Text>
            <Text style={styles.colKuantitas}>Kuantitas (Kg)</Text>
            <Text style={styles.colHarga}>Harga/Kg (Rp)</Text>
            <Text style={styles.colJumlah}>Jumlah (Rp)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colNo}>1</Text>
            <Text style={styles.colNama}>{itemName}</Text>
            <Text style={styles.colKuantitas}>{quantity.toLocaleString("id-ID")}</Text>
            <Text style={styles.colHarga}>{pricePerKg.toLocaleString("id-ID")}</Text>
            <Text style={styles.colJumlah}>{subtotal.toLocaleString("id-ID")}</Text>
          </View>
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
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
          <Text style={{ fontWeight: 700 }}>KETERANGAN PEMBAYARAN</Text>
          <Text>Pembayaran harus ditujukan kepada CV. BUMI MULIA LESTARI.</Text>
          <Text>BANK BRI | No. Rekening: 066101001608564 | A/N: CV. BUMI MULIA LESTARI</Text>
        </View>

        <View style={styles.signatureBlock}>
          <Text>Hormat kami,</Text>
          <Text style={{ marginTop: 20 }}>CV. BUMI MULIA LESTARI</Text>
        </View>
      </Page>
    </Document>
  );
}
