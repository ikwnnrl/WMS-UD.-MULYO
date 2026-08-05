import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";

// Custom half-A4 paper size matching the original Excel print setup:
// Custom 9.5 x 5.5 inch (241.3 x 139.7 mm), Landscape.
const PAGE_WIDTH = 241.3 * 2.8346; // mm to points (1mm = 2.8346pt)
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
    width: 32,
    height: 32,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 700,
  },
  companyDetail: {
    fontSize: 7,
    color: "#333",
  },
  rightBlock: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center",
    marginVertical: 4,
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  infoLeft: {
    width: "55%",
  },
  infoRight: {
    width: "40%",
  },
  infoLine: {
    flexDirection: "row",
    marginBottom: 1,
  },
  infoLabel: {
    width: 70,
  },
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
  colUnit: { width: "15%" },
  colNama: { width: "55%" },
  colBerat: { width: "30%", textAlign: "right" },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  signatureBlock: {
    width: "40%",
    textAlign: "center",
  },
  signatureSpace: {
    marginTop: 28,
  },
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
  tanggal: string; // e.g. "5 Agustus 2026"
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
              <Text style={styles.companyDetail}>Penggilingan Onggok, Pati & Gaplek</Text>
            </View>
          </View>
          <View style={styles.rightBlock}>
            <Text>Tegal, {tanggal}</Text>
            <Text style={{ marginTop: 4 }}>Kepada Yth.</Text>
            <Text style={{ fontWeight: 700 }}>{namaPelanggan}</Text>
            <Text style={{ maxWidth: 140, textAlign: "right" }}>{alamatPelanggan}</Text>
          </View>
        </View>

        <Text style={styles.title}>SURAT JALAN</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>No. Surat Jalan</Text>
              <Text>: {noSuratJalan}</Text>
            </View>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>No. PO</Text>
              <Text>: {noPO}</Text>
            </View>
          </View>
          <View style={styles.infoRight}>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>No. Polisi</Text>
              <Text>: {noPolisi}</Text>
            </View>
          </View>
        </View>

        <Text>Harap terima dengan baik barang-barang berikut ini:</Text>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colUnit}>Unit</Text>
            <Text style={styles.colNama}>Nama Barang</Text>
            <Text style={styles.colBerat}>Berat</Text>
          </View>
          {items.map((item, idx) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colNama}>{item.namaBarang}</Text>
              <Text style={styles.colBerat}>{item.beratKg} Kg</Text>
            </View>
          ))}
        </View>

        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <Text>Yang Menerima,</Text>
            <Text style={styles.signatureSpace}>................................</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text>Hormat kami,</Text>
            <Text style={styles.signatureSpace}>CV. BUMI MULIA LESTARI</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
