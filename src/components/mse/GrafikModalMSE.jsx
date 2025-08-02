import React, { useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function GrafikModalMSE({ data, onClose }) {
  const chartRef = useRef();

  const { meta, monitoring = [], comparison } = data;

  const allComparisons = Array.isArray(comparison)
    ? comparison
    : comparison && comparison.monitoring
    ? [
        {
          meta: {
            tanggal:
              data.comparisonDate || comparison?.meta?.tanggal || "Sebelumnya",
          },
          monitoring: comparison.monitoring,
        },
      ]
    : [];

  allComparisons.push({
    meta: {
      tanggal: meta?.tanggal || "Bulan Ini",
    },
    monitoring,
  });

  const cleanNum = (val) => {
    if (!val) return 0;
    return parseFloat(val.toString().replace(/[^\d.-]/g, "")) || 0;
  };

  const extractVal = (mon, uraian) => {
    if (!Array.isArray(mon)) return 0;
    const target = mon.find((m) => m.uraian === uraian);
    return cleanNum(target?.items?.[0]?.hasil);
  };

  const extractBiayaTotal = (mon) => {
    if (!Array.isArray(mon)) return 0;
    const biaya = mon.find((m) => m.uraian === "Biaya operasional per bulan");
    if (!biaya) return 0;
    const totalItem =
      biaya.items.find((item) =>
        ["total", "biaya total", "total biaya"].includes(
          item.nama?.toLowerCase()
        )
      ) || biaya.items[0];
    return cleanNum(totalItem?.hasil);
  };

  const sumTenaga = (mon, uraian) => {
    if (!Array.isArray(mon)) return 0;
    const target = mon.find((m) => m.uraian === uraian);
    if (!target) return 0;
    return target.items.reduce((sum, item) => sum + cleanNum(item?.hasil), 0);
  };

  const chartData = allComparisons
    .map(({ meta: m, monitoring: mon }) => {
      const omset = extractVal(mon, "Omset / penjualan per bulan");
      const biaya = extractBiayaTotal(mon);

      return {
        name: m.tanggal || "Tanpa Tanggal",
        Omset: omset,
        Biaya: biaya,
        Produksi: extractVal(mon, "Jumlah produksi per bulan"),
        TenagaTetap: sumTenaga(mon, "Jumlah tenaga kerja tetap"),
        TenagaTidakTetap: sumTenaga(mon, "Jumlah tenaga kerja tidak tetap"),
        Laba: omset - biaya,
        tanggal: m.tanggal || "1900-01-01",
      };
    })
    .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

  const formatCurrency = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const maxLaba = Math.max(...chartData.map((d) => d.Laba));
  const minBiaya = Math.min(...chartData.map((d) => d.Biaya));
  const maxOmset = Math.max(...chartData.map((d) => d.Omset));

  const handleExportImage = async () => {
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement("a");
    link.download = `grafik_mse_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleExportPDF = async () => {
    const canvas = await html2canvas(chartRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape");
    pdf.addImage(imgData, "PNG", 10, 10, 280, 150);
    pdf.save(`grafik_mse_${Date.now()}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-start pt-10 overflow-y-auto">
      <div className="bg-white p-6 rounded shadow w-full sm:max-w-md md:max-w-2xl lg:max-w-4xl space-y-6 mx-2">
        <h2 className="text-2xl font-bold text-center">
          Grafik Perbandingan MSE
        </h2>

        <div ref={chartRef} className="w-full h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(val) =>
                  val >= 1_000_000 ? val / 1_000_000 + "jt" : val
                }
              />
              <Tooltip formatter={(val, key) => [formatCurrency(val), key]} />
              <Legend />
              <Line
                type="monotone"
                dataKey="Omset"
                stroke="#4CAF50"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Produksi"
                stroke="#2196F3"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Biaya"
                stroke="#FF9800"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="TenagaTetap"
                stroke="#9C27B0"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="TenagaTidakTetap"
                stroke="#795548"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Laba"
                stroke="#009688"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto text-sm mt-6">
          <table className="min-w-full border text-center rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Kategori</th>
                {chartData.map((entry, idx) => (
                  <th key={idx} className="p-2 border">
                    {entry.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                "Omset",
                "Biaya",
                "TenagaTetap",
                "TenagaTidakTetap",
                "Laba",
              ].map((key) => (
                <tr key={key} className="border-t">
                  <td className="p-2 border font-medium">{key}</td>
                  {chartData.map((entry, idx) => {
                    const val = entry[key];
                    return (
                      <td key={idx} className="p-2 border">
                        {isNaN(val)
                          ? "-"
                          : key.includes("Tenaga")
                          ? val
                          : formatCurrency(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-2 sm:gap-0">
          <button
            onClick={handleExportImage}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Ekspor Gambar
          </button>
          <button
            onClick={onClose}
            className="text-gray-600 hover:underline w-full sm:w-auto text-center"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
