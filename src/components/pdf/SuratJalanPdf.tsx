import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

// Replikasi sheet "Surat Jalan" print area B2:J23.
// Kertas: custom continuous form half, 9.5 x 5.5 inch = 241.3 x 139.7mm (landscape).
// (Spec section: kertas continuous form perforasi tengah, 1 SJ per half.)
const PAGE_WIDTH = 241.3 * 2.8346; // mm → points (1mm = 2.8346pt)
const PAGE_HEIGHT = 139.7 * 2.8346;

const NAVY = "#17365D";
const GRAY_LABEL = "#555555";

// Proporsi kolom dihitung dari lebar kolom Excel:
// B+C (Unit) = 26%, D+E+F (Nama Barang) = 53%, G (Berat) = 21%
const W_UNIT = "26%";
const W_NAMA = "53%";
const W_BERAT = "21%";

const styles = StyleSheet.create({
  page: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 10,
    paddingRight: 8,
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
    alignItems: "center",
    gap: 6,
  },
  // Logo Excel ~455695 × 666070 EMU = 36pt × 52.6pt (portrait, ratio ~0.68)
  logo: {
    width: 30,
    height: 44,
  },
  companyTextBlock: {
    justifyContent: "center",
  },
  companyName: { fontSize: 12, fontWeight: 700, color: NAVY, textAlign: "center" },
  companyDetail: { fontSize: 8, color: "#000", textAlign: "center" },
  companyTagline: { fontSize: 8, fontWeight: 700, color: GRAY_LABEL, textAlign: "center" },
  rightBlock: { alignItems: "flex-end", maxWidth: 150 },
  rightDate: { fontSize: 8, fontWeight: 700, color: NAVY },
  rightLabel: { fontSize: 8, fontWeight: 700, color: NAVY, marginTop: 2 },
  rightValue: { fontSize: 9, textAlign: "right" },
  title: { fontSize: 13, fontWeight: 700, textAlign: "center", color: NAVY, marginTop: 2, marginBottom: 2 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  infoLeft: { width: "62%" },
  infoRight: { width: "36%" },
  infoLine: { flexDirection: "row", marginBottom: 1 },
  infoLabel: { width: 62, fontSize: 9, fontWeight: 700, color: NAVY },
  infoValue: { fontSize: 9, fontWeight: 700, color: NAVY, flex: 1 },
  intro: { fontSize: 9, fontStyle: "italic", color: GRAY_LABEL, marginBottom: 2 },
  table: { marginTop: 1 },
  // Header tabel: background NAVY solid, teks PUTIH (mirror Excel B11:G11 fill #17365D)
  tableHeaderRow: { flexDirection: "row", backgroundColor: NAVY, paddingVertical: 2 },
  tableHeaderCell: { fontSize: 9, fontWeight: 700, color: "#FFFFFF", textAlign: "center" },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#999",
    paddingVertical: 2,
    minHeight: 13,
  },
  colUnit: { width: W_UNIT, textAlign: "center" },
  colNama: { width: W_NAMA, textAlign: "center" },
  colBerat: { width: W_BERAT, textAlign: "right", paddingRight: 4 },
  tableCell: { fontSize: 9 },
  signatureRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  signatureBlock: { width: "40%", alignItems: "center" },
  signatureLabel: { fontSize: 9, color: "#666", textAlign: "center" },
  signatureSpace: { marginTop: 26, fontSize: 9, textAlign: "center" },
  signatureCompany: { marginTop: 26, fontSize: 9, fontWeight: 700, color: NAVY, textAlign: "center" },
});

export interface SuratJalanItem {
  unit: number | string;
  namaBarang: string;
  beratKg: number | string;
}

export interface SuratJalanPdfProps {
  noSuratJalan: string;
  noPO: string;
  noPolisi: string;
  tanggal: string;
  namaPelanggan: string;
  alamatPelanggan: string;
  items: SuratJalanItem[];
  logoUrl?: string;
}

export function SuratJalanPdf({
  noSuratJalan,
  noPO,
  noPolisi,
  tanggal,
  namaPelanggan,
  alamatPelanggan,
  items,
  logoUrl,
}: SuratJalanPdfProps) {
  // Tabel Excel punya 6 baris item (B12:G17); pad agar tinggi tabel konsisten.
  const paddedItems: SuratJalanItem[] = [...items];
  while (paddedItems.length < 6) {
    paddedItems.push({ unit: "", namaBarang: "", beratKg: "" });
  }

  return (
    <Document>
      <Page size={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }} style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.companyBlock}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            <View style={styles.companyTextBlock}>
              <Text style={styles.companyName}>CV. BUMI MULIA LESTARI</Text>
              <Text style={styles.companyDetail}>Jl. Lingkar Slawi - Kab. Tegal</Text>
              <Text style={styles.companyDetail}>Telp. 0853 2621 5550</Text>
              <Text style={styles.companyTagline}>Penggilingan Onggok, Pati & Gaplek</Text>
            </View>
          </View>
          <View style={styles.rightBlock}>
            <Text style={styles.rightDate}>Tegal, {tanggal}</Text>
            <Text style={styles.rightLabel}>Kepada Yth.</Text>
            <Text style={styles.rightValue}>{namaPelanggan}</Text>
            <Text style={[styles.rightValue, { fontSize: 8 }]}>{alamatPelanggan}</Text>
          </View>
        </View>

        <Text style={styles.title}>SURAT JALAN</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>No. Surat Jalan</Text>
              <Text style={styles.infoValue}>: {noSuratJalan}</Text>
            </View>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>No. PO</Text>
              <Text style={styles.infoValue}>: {noPO}</Text>
            </View>
          </View>
          <View style={styles.infoRight}>
            <View style={styles.infoLine}>
              <Text style={[styles.infoLabel, { width: 55, textAlign: "right" }]}>No. Polisi :</Text>
              <Text style={styles.infoValue}> {noPolisi}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.intro}>Harap terima dengan baik barang-barang berikut ini:</Text>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unit</Text>
            <Text style={[styles.tableHeaderCell, styles.colNama]}>Nama Barang</Text>
            <Text style={[styles.tableHeaderCell, styles.colBerat]}>Berat</Text>
          </View>
          {paddedItems.map((item, idx) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={[styles.tableCell, styles.colUnit]}>{item.unit}</Text>
              <Text style={[styles.tableCell, styles.colNama]}>{item.namaBarang}</Text>
              <Text style={[styles.tableCell, styles.colBerat]}>
                {item.beratKg !== "" ? `${item.beratKg} Kg` : ""}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Yang Menerima,</Text>
            <Text style={styles.signatureSpace}>................................</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Hormat kami,</Text>
            <Text style={styles.signatureCompany}>CV. BUMI MULIA LESTARI</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
