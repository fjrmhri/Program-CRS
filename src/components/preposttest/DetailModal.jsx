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
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl w-full sm:max-w-md md:max-w-2xl lg:max-w-4xl space-y-4 mx-2 sm:mx-auto animate-fadeIn">
        <h2 className="text-2xl font-bold text-blue-700 text-center break-words">
          {title}
        </h2>

        <div className="text-xs sm:text-sm text-gray-600 space-y-1 text-center">
          <p>
            📆 Tanggal Pre Test:{" "}
            <span className="font-medium">
              {new Date(preDate).toLocaleDateString("id-ID")}
            </span>
          </p>
          <p>
            📆 Tanggal Post Test:{" "}
            <span className="font-medium">
              {new Date(postDate).toLocaleDateString("id-ID")}
            </span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <ChartComp raw={filteredRaw} />
        </div>

        <div className="space-y-1 text-xs sm:text-sm mt-4">
          <p>
            👥 Jumlah peserta:{" "}
            <span className="font-medium">{analyses.total}</span>
          </p>
          <p>
            📊 Rata-rata Pre Test:{" "}
            <span className="font-medium">{analyses.avgPre.toFixed(2)}</span>
          </p>
          <p>
            📈 Rata-rata Post Test:{" "}
            <span className="font-medium">{analyses.avgPost.toFixed(2)}</span>
          </p>
          <p>
            ⬆️ Peningkatan:{" "}
            <span className="font-medium">
              {analyses.peningkatan.toFixed(2)}%
            </span>
          </p>
          <p>
            ✅ Peserta yang paham (≥70):{" "}
            <span className="font-medium">{analyses.paham}</span> orang
          </p>
          <div className="mt-2">
            <p className="font-semibold">Distribusi:</p>
            <ul className="list-disc ml-4 sm:ml-6">
              <li>Rendah (&lt;60): {distribusi.rendah} orang</li>
              <li>Cukup (60-69): {distribusi.cukup} orang</li>
              <li>Tinggi (70-84): {distribusi.tinggi} orang</li>
              <li>Sangat Tinggi (≥85): {distribusi.sangatTinggi} orang</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4">
          <select
            value={selectedPosyandu}
            onChange={(e) => setSelectedPosyandu(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none transition bg-white shadow-sm w-full sm:w-auto"
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
            {sortBySelisih
              ? "🔄 Urutan Asli"
              : "⬆️ Urutkan Berdasarkan Selisih"}
          </button>
        </div>

        <div className="overflow-x-auto max-h-64 border rounded mt-2 text-xs sm:text-sm">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100">
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
                <tr key={i} className="border-t">
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

        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-2 sm:gap-0">
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition w-full sm:w-auto"
          >
            Ekspor Excel
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
