import React, { useEffect, useState } from "react";
import { onValue, ref, remove } from "firebase/database";
import { addLog } from "../../utils/logUtils";
import { db } from "../../firebase";

export default function Dashboard({ user, onAdd, onView, onEdit }) {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("Semua");
  const [errorMessage, setErrorMessage] = useState("");

  // Mengambil data realtime dengan fallback ketika gagal memuat
  useEffect(() => {
    const q = ref(db, "datasets");
    return onValue(
      q,
      (snapshot) => {
        const data = snapshot.val() || {};
        const arr = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        arr.sort((a, b) => b.createdAt - a.createdAt);
        setDatasets(arr);
      },
      (error) => {
        console.error("Gagal membaca data datasets:", error);
        setErrorMessage("Tidak dapat memuat data. Periksa koneksi atau ulangi nanti.");
      }
    );
  }, []);

  const handleDelete = async (id) => {
    if (confirm("Yakin hapus data ini?")) {
      const dataToDelete = datasets.find((d) => d.id === id);
      try {
        await remove(ref(db, `datasets/${id}`));
        await addLog({
          namaUser: user?.nama || "Unknown",
          aksi: `${user?.nama || "User"} menghapus data Pre-Post Test (${dataToDelete?.title || id})`,
          dataTerkait: dataToDelete,
        });
      } catch (error) {
        console.error("Gagal menghapus dataset:", error);
        setErrorMessage("Data tidak berhasil dihapus. Coba lagi dalam beberapa saat.");
      }
    }
  };

  // === Filter data berdasarkan pilihan ===
  const filtered =
    selectedDataset === "Semua"
      ? datasets
      : datasets.filter((d) => d.id === selectedDataset);

  // === Hitung statistik summary ===
  let highestScore = "-";
  let improvement = "-";
  let totalParticipants = "-";
  let topOne = "-";

  if (filtered.length > 0) {
    const rawData = filtered.flatMap((d) => d.raw || []);
    if (rawData.length > 0) {
      // Nilai tertinggi post test
      const max = Math.max(...rawData.map((d) => d.post || 0));
      highestScore = max;

      // Peningkatan rata-rata (post - pre)
      const avgPre =
        rawData.reduce((sum, d) => sum + (d.pre || 0), 0) / rawData.length;
      const avgPost =
        rawData.reduce((sum, d) => sum + (d.post || 0), 0) / rawData.length;
      improvement = `${(((avgPost - avgPre) / (avgPre || 1)) * 100).toFixed(1)}%`;

      // Jumlah peserta
      totalParticipants = rawData.length;

      // Juara 1 (peserta dengan selisih terbesar)
      const ranked = [...rawData].sort((a, b) => b.post - b.pre - (a.post - a.pre));
      topOne = ranked[0]?.nama || "-";
    }
  }

  const stats = [
    {
      title: "Nilai Tertinggi",
      value: highestScore,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Peningkatan Kemampuan",
      value: improvement,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Jumlah Peserta",
      value: totalParticipants,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Juara 1",
      value: topOne,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700">Data Pre-Post Test</h2>
        <button
          onClick={onAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm sm:text-base font-semibold shadow hover:bg-blue-700 active:scale-95 transition"
        >
          + Tambah Data
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          {errorMessage}
        </div>
      )}

      {/* SELECT DATASET */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
        <select
          value={selectedDataset}
          onChange={(e) => setSelectedDataset(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-300 focus:outline-none transition bg-white shadow-sm w-full sm:w-auto"
        >
          <option value="Semua">Semua Dataset</option>
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
      </div>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, idx) => (
          <div
            key={idx}
            className={`rounded-xl p-4 shadow-sm border ${s.bg} transition hover:shadow-md`}
          >
            <p className="text-sm font-medium text-gray-600">{s.title}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* TABLE */}
      {datasets.length === 0 ? (
        <p className="text-gray-500 text-sm">Belum ada data.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-[320px] sm:min-w-[600px] w-full text-sm border rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Judul</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">Pre</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">Post</th>
                <th className="px-3 py-2 text-left">Peserta</th>
                <th className="px-3 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-3 py-2">{d.title}</td>
                  <td className="px-3 py-2 hidden md:table-cell">
                    {new Date(d.preDate).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell">
                    {new Date(d.postDate).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-3 py-2">{d.raw?.length || 0}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onView(d)}
                        className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded text-xs hover:bg-blue-100 transition"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => onEdit && onEdit(d)}
                        className="bg-yellow-500 text-white hover:bg-yellow-600 px-5 py-1.5 rounded text-xs font-semibold transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs hover:bg-red-100 transition"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
