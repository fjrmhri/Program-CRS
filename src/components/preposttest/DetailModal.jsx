import React, { useState } from "react";
import ChartComp from "./ChartComp";
import ExcelJS from "exceljs";

export default function DetailModal({ data, onClose }) {
  const { title, preDate, postDate, raw, analyses } = data;
  const [sortBySelisih, setSortBySelisih] = useState(false);
  const [selectedPosyandu, setSelectedPosyandu] = useState("Semua");

  const filteredRaw =
    selectedPosyandu === "Semua"
      ? raw
      : raw.filter((d) => d.posyandu === selectedPosyandu);

  const sortedRaw = sortBySelisih
    ? [...filteredRaw].sort((a, b) => b.post - b.pre - (a.post - a.pre))
    : filteredRaw;

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Hasil Pre-Post Test");

    sheet.columns = [
      { header: "Nama Peserta", key: "nama", width: 25 },
      { header: "Asal Desa", key: "desa", width: 20 },
      { header: "Posyandu", key: "posyandu", width: 20 },
      { header: "Pre Test", key: "pre", width: 15 },
      { header: "Post Test", key: "post", width: 15 },
      { header: "Selisih", key: "selisih", width: 15 },
      { header: "Ranking", key: "ranking", width: 10 },
    ];

    const ranked = [...raw]
      .map((d) => ({ ...d, selisih: d.post - d.pre }))
      .sort((a, b) => b.selisih - a.selisih);

    ranked.forEach((row, index) =>
      sheet.addRow({ ...row, ranking: index + 1 })
    );

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/\s/g, "_")}_hasil.xlsx`;
    a.click();
  };

  const distribusi = {
    rendah: raw.filter((d) => d.post < 60).length,
    cukup: raw.filter((d) => d.post >= 60 && d.post < 70).length,
    tinggi: raw.filter((d) => d.post >= 70 && d.post < 85).length,
    sangatTinggi: raw.filter((d) => d.post >= 85).length,
  };

  const posyanduList = ["Semua", ...new Set(raw.map((d) => d.posyandu))];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-start pt-10 overflow-y-auto">
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl w-full sm:max-w-md md:max-w-3xl lg:max-w-5xl space-y-6 mx-2 sm:mx-auto animate-fadeIn">
        {/* TITLE */}
        <h2 className="text-2xl md:text-3xl font-bold text-blue-700 text-center">
          {title}
        </h2>

        {/* INFO DATE */}
        <div className="text-xs sm:text-sm text-gray-600 space-y-1 text-center">
          <p>
            📆 Pre Test:{" "}
            <span className="font-medium">
              {new Date(preDate).toLocaleDateString("id-ID")}
            </span>
          </p>
          <p>
            📆 Post Test:{" "}
            <span className="font-medium">
              {new Date(postDate).toLocaleDateString("id-ID")}
            </span>
          </p>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-600">Jumlah Peserta</p>
            <p className="text-xl font-bold text-blue-600">{analyses.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-600">Rata-rata Pre</p>
            <p className="text-xl font-bold text-green-600">
              {analyses.avgPre.toFixed(1)}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-600">Rata-rata Post</p>
            <p className="text-xl font-bold text-purple-600">
              {analyses.avgPost.toFixed(1)}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-600">Peningkatan</p>
            <p className="text-xl font-bold text-yellow-600">
              {analyses.peningkatan.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* CHART */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-xl shadow-sm">
          <ChartComp raw={filteredRaw} />
        </div>

        {/* DISTRIBUSI */}
        <div className="text-xs sm:text-sm mt-4">
          <p className="font-semibold mb-1">Distribusi Nilai:</p>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <li className="bg-red-50 p-2 rounded-lg text-center text-red-600">
              Rendah (&lt;60): {distribusi.rendah}
            </li>
            <li className="bg-yellow-50 p-2 rounded-lg text-center text-yellow-600">
              Cukup (60-69): {distribusi.cukup}
            </li>
            <li className="bg-blue-50 p-2 rounded-lg text-center text-blue-600">
              Tinggi (70-84): {distribusi.tinggi}
            </li>
            <li className="bg-green-50 p-2 rounded-lg text-center text-green-600">
              Sangat Tinggi (≥85): {distribusi.sangatTinggi}
            </li>
          </ul>
        </div>

        {/* FILTER + SORT */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4">
          <select
            value={selectedPosyandu}
            onChange={(e) => setSelectedPosyandu(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-300 bg-white shadow-sm w-full sm:w-auto"
          >
            {posyanduList.map((pos, i) => (
              <option key={i} value={pos}>
                {pos}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortBySelisih((s) => !s)}
            className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold shadow hover:bg-blue-100 transition w-full sm:w-auto"
          >
            {sortBySelisih ? "🔄 Urutan Asli" : "⬆️ Urutkan Selisih"}
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto max-h-64 border rounded mt-2 text-xs sm:text-sm">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-2">Nama</th>
                <th className="p-2">Desa</th>
                <th className="p-2">Posyandu</th>
                <th className="p-2">Pre</th>
                <th className="p-2">Post</th>
                <th className="p-2">Selisih</th>
              </tr>
            </thead>
            <tbody>
              {sortedRaw.map((row, i) => (
                <tr key={i} className="border-t hover:bg-gray-50 transition">
                  <td className="p-2">{row.nama}</td>
                  <td className="p-2">{row.desa || "-"}</td>
                  <td className="p-2">{row.posyandu || "-"}</td>
                  <td className="p-2">{row.pre}</td>
                  <td className="p-2">{row.post}</td>
                  <td className="p-2">{row.post - row.pre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-2">
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition w-full sm:w-auto"
          >
            Ekspor Excel
          </button>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 underline w-full sm:w-auto text-center"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
