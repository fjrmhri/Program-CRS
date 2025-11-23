import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import MSEDocument from "./MSEDocument";

export default function DetailModalMSE({ data, onClose }) {
  const comparisons = Array.isArray(data.comparison)
    ? data.comparison
    : data.comparison?.monitoring
    ? [data.comparison]
    : [];

  const latestComparison = comparisons
    .filter((c) => c.meta?.tanggal || c.meta?.createdAt)
    .sort(
      (a, b) =>
        new Date(b.meta?.tanggal || "1900-01-01") -
        new Date(a.meta?.tanggal || "1900-01-01")
    )[0];

  const isComparisonNewer =
    latestComparison &&
    new Date(latestComparison.meta?.tanggal || "1900-01-01") >
      new Date(data?.meta?.tanggal || "1900-01-01");

  const meta = isComparisonNewer
    ? { ...data?.meta, ...latestComparison.meta }
    : data?.meta || {};

  const monitoring = isComparisonNewer
    ? latestComparison.monitoring || []
    : data?.monitoring || [];

  const formatHasil = (val) => {
    if (!val || val === "-") return "-";
    const number = parseFloat(val.toString().replace(/[^\d.-]/g, ""));
    if (isNaN(number)) return val;
    return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
      number
    );
  };

  const safeFileName = (meta?.nama || "data")
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "");

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-start pt-10 overflow-y-auto">
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl w-full sm:max-w-md md:max-w-2xl lg:max-w-4xl space-y-4 mx-2 sm:mx-auto animate-fadeIn">
        <h2 className="text-2xl font-bold text-green-700 text-center mb-2">
          Detail Monitoring MSE
        </h2>

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

        <div className="overflow-x-auto mt-4">
          <table className="min-w-full text-xs border rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Uraian</th>
                <th className="p-2">Item</th>
                <th className="p-2">Hasil Monitoring</th>
              </tr>
            </thead>
            <tbody>
              {monitoring.map((row, i) =>
                row.uraian === "Omset / penjualan per bulan" ? (
                  <tr key={i} className="border-t border-b">
                    <td className="p-2 border-r">{row.uraian}</td>
                    <td className="p-2 border-r">Rp</td>
                    <td className="p-2 border-r text-right">
                      {formatHasil(row.items?.[0]?.hasil)}
                    </td>
                  </tr>
                ) : (
                  row.items.map((item, idx) => (
                    <tr key={`${i}-${idx}`} className="border-t border-b">
                      {idx === 0 ? (
                        <td
                          className="p-2 border-r align-top"
                          rowSpan={row.items.length}
                          style={{ verticalAlign: "top" }}
                        >
                          {row.uraian}
                        </td>
                      ) : null}
                      <td className="p-2 border-r">{item.nama || "-"}</td>
                      <td className="p-2 border-r text-right">
                        {formatHasil(item.hasil)}
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-2 sm:gap-0">
          <PDFDownloadLink
            document={<MSEDocument data={data} />}
            fileName={`Template_MSE_${safeFileName}.pdf`}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-green-700 transition w-full sm:w-auto text-center"
          >
            Ekspor PDF
          </PDFDownloadLink>
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
