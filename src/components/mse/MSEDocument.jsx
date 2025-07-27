import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import logo from "../../assets/logo.PNG";
import calibri from "../../assets/fonts/calibri-regular.ttf";
import calibriBold from "../../assets/fonts/calibri-bold.ttf";
import calibriItalic from "../../assets/fonts/calibri-italic.ttf";
import calibriBoldItalic from "../../assets/fonts/calibri-bold-italic.ttf";

Font.register({
  family: "Calibri",
  fonts: [
    { src: calibri },
    { src: calibriBold, fontWeight: "bold" },
    { src: calibriItalic, fontStyle: "italic" },
    { src: calibriBoldItalic, fontWeight: "bold", fontStyle: "italic" },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 40,
    fontFamily: "Calibri",
  },
  logo: {
    width: 100,
    height: 100,
    position: "absolute",
    top: -15,
    left: 40,
  },
  header: {
    textAlign: "center",
    marginBottom: 10,
  },
  titleMain: {
    fontSize: 14,
    fontWeight: "bold",
  },
  titleSub: {
    fontSize: 14,
    fontWeight: "bold",
  },
  formTitle: {
    fontSize: 14,
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center",
  },
  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  metaColumn: {
    width: "50%",
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "flex-start",
    paddingLeft: 10,
  },
  label: {
    width: "50%",
    fontWeight: "bold",
    textAlign: "left",
    paddingRight: 10,
  },
  value: {
    width: "50%",
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    backgroundColor: "#eee",
    padding: 4,
    fontWeight: "bold",
  },
  tableCol: {
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    padding: 4,
  },
  col1: { width: "40%" },
  col2: { width: "30%" },
  col3: { width: "30%" },
});

const MSEDocument = ({ data }) => {
  const { meta, monitoring, comparison } = data;

  const metaData = [
    ["Nama Pelaku/Pemilik/Lembaga UMKM", meta.nama],
    ["Nama Usaha/Merk Produk", meta.usaha],
    ["Nomor HP/WA", meta.hp],
    ["Desa", meta.desa],
    ["Kota/Kabupaten", meta.kota],
    ["Estate", meta.estate],
    ["Nama CDO", meta.cdo],
    ["Klasifikasi Mitra", meta.klasifikasi],
  ];

  const transparentUraians = ["Uraian 1", "Uraian 2"];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Image style={styles.logo} src={logo} />
        <View style={styles.header}>
          <Text style={styles.titleMain}>PT. RIAU ANDALAN PULP AND PAPER</Text>
          <Text style={styles.titleSub}>
            Community Development – SME’s Program
          </Text>
          <Text style={styles.formTitle}>
            Formulir Monitoring Mitra Dampingan SME’s OFFLINE
          </Text>
        </View>

        <View style={styles.metaContainer}>
          <View style={styles.metaColumn}>
            {metaData.slice(0, 4).map(([label, val]) => (
              <View key={label} style={styles.metaRow}>
                <Text style={styles.label}>{label}:</Text>
                <Text style={styles.value}>{val || "-"}</Text>
              </View>
            ))}
          </View>
          <View style={styles.metaColumn}>
            {metaData.slice(4).map(([label, val]) => (
              <View key={label} style={styles.metaRow}>
                <Text style={styles.label}>{label}:</Text>
                <Text style={styles.value}>{val || "-"}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableColHeader, styles.col1]}>Uraian</Text>
            <Text style={[styles.tableColHeader, styles.col2]}>Item</Text>
            <Text style={[styles.tableColHeader, styles.col3]}>
              Hasil Monitoring
            </Text>
          </View>

          {monitoring.map((row, i) => {
            const showUraian = row.items.length > 0;
            const isTransparent = transparentUraians.includes(row.uraian);

            return row.items.map((item, j) => (
              <View key={`${i}-${j}`} style={styles.tableRow}>
                {showUraian && j === 0 ? (
                  <Text style={[styles.tableCol, styles.col1]}>
                    {row.uraian}
                  </Text>
                ) : (
                  <Text
                    style={[
                      styles.tableCol,
                      styles.col1,
                      { opacity: isTransparent ? 0 : 1 },
                    ]}
                  ></Text>
                )}
                <Text style={[styles.tableCol, styles.col2]}>
                  {item.nama || "-"}
                </Text>
                <Text style={[styles.tableCol, styles.col3]}>
                  {item.hasil || "-"}
                </Text>
              </View>
            ));
          })}
        </View>
      </Page>
    </Document>
  );
};

export default MSEDocument;
