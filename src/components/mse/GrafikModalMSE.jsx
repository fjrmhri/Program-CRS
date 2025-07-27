import React from "react";
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

export default function GrafikModalMSE({ data, onClose }) {
  const { meta, monitoring = [], comparison, comparisonDate } = data;

  const prevMonitoring = Array.isArray(comparison)
    ? comparison
    : Array.isArray(comparison?.monitoring)
    ? comparison.monitoring
    : [];

  const prevMeta = {
    tanggal: comparisonDate || comparison?.meta?.tanggal || "Sebelumnya",
    labaBersih: comparison?.meta?.labaBersih || meta?.labaBersih || "0",
  };

  const cleanNum = (val) => {
    if (!val) return 0;
    return parseFloat(val.toString().replace(/[^\d.-]/g, "")) || 0;
  };

  const extractVal = (mon, uraian) => {
    if (!Array.isArray(mon)) return 0;
    const target = mon.find((m) => m.uraian === uraian);
    return cleanNum(target?.items?.[0]?.hasil);
  };

  const sumTenaga = (mon, uraian) => {
    if (!Array.isArray(mon)) return 0;
    const target = mon.find((m) => m.uraian === uraian);
    if (!target) return 0;
    return target.items.reduce((sum, item) => sum + cleanNum(item?.hasil), 0);
  };

  const chartData = [
    {
      name: prevMeta?.tanggal || "Sebelumnya",
      Omset: extractVal(prevMonitoring, "Omset / penjualan per bulan"),
      Produksi: extractVal(prevMonitoring, "Jumlah produksi per bulan"),
      Biaya: extractVal(prevMonitoring, "Total biaya operasional per bulan"),
      TenagaTetap: sumTenaga(prevMonitoring, "Jumlah tenaga kerja tetap"),
      TenagaTidakTetap: sumTenaga(
        prevMonitoring,
        "Jumlah tenaga kerja tidak tetap"
      ),
      Laba: cleanNum(prevMeta?.labaBersih),
    },
    {
      name: meta?.tanggal || "Bulan Ini",
      Omset: extractVal(monitoring, "Omset / penjualan per bulan"),
      Produksi: extractVal(monitoring, "Jumlah produksi per bulan"),
      Biaya: extractVal(monitoring, "Total biaya operasional per bulan"),
      TenagaTetap: sumTenaga(monitoring, "Jumlah tenaga kerja tetap"),
      TenagaTidakTetap: sumTenaga(
        monitoring,
        "Jumlah tenaga kerja tidak tetap"
      ),
      Laba: cleanNum(meta?.labaBersih),
    },
  ];

  const formatCurrency = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-start pt-10 overflow-y-auto">
      <div className="bg-white p-6 rounded shadow w-full sm:max-w-md md:max-w-2xl lg:max-w-4xl space-y-6 mx-2">
        <h2 className="text-2xl font-bold text-center">
          Grafik Perbandingan MSE
        </h2>

        {/* Meta Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {[
            ["Nama", meta.nama],
            ["Usaha", meta.usaha],
            ["HP/WA", meta.hp],
            ["Desa", meta.desa],
            ["Kota/Kabupaten", meta.kota],
            ["Estate", meta.estate],
            ["CDO", meta.cdo],
            ["Klasifikasi", meta.klasifikasi],
            ["Tanggal Monitoring", meta.tanggal],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <b>{label}:</b> <span>{val || "-"}</span>
            </div>
          ))}
        </div>

        {/* Grafik */}
        <div className="w-full h-72 mt-4">
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

        {/* Tabel Ringkasan */}
        <div className="overflow-x-auto text-sm mt-6">
          <table className="min-w-full border text-center rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Kategori</th>
                <th className="p-2 border">{chartData[0].name}</th>
                <th className="p-2 border">{chartData[1].name}</th>
              </tr>
            </thead>
            <tbody>
              {[
                "Omset",
                "Produksi",
                "Biaya",
                "TenagaTetap",
                "TenagaTidakTetap",
                "Laba",
              ].map((key) => {
                const val1 = chartData[0][key];
                const val2 = chartData[1][key];

                const renderVal = (val) =>
                  isNaN(val)
                    ? "-"
                    : key.includes("Tenaga")
                    ? val
                    : formatCurrency(val);

                return (
                  <tr key={key} className="border-t">
                    <td className="p-2 border font-medium">{key}</td>
                    <td className="p-2 border">{renderVal(val1)}</td>
                    <td className="p-2 border">{renderVal(val2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4">
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
