import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue, remove } from "firebase/database";
import { addLog } from "../../utils/logUtils";

export default function Dashboard({ user, onAdd, onView, onEdit }) {
  const [datasets, setDatasets] = useState([]);

  useEffect(() => {
    const q = ref(db, "datasets");
    return onValue(q, (snapshot) => {
      const data = snapshot.val() || {};
      const arr = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      arr.sort((a, b) => b.createdAt - a.createdAt);
      setDatasets(arr);
    });
  }, []);

  const handleDelete = async (id) => {
    if (confirm("Yakin hapus data ini?")) {
      // Ambil data yang akan dihapus untuk log
      const dataToDelete = datasets.find((d) => d.id === id);
      await remove(ref(db, `datasets/${id}`));
      // Tambahkan log aktivitas
      await addLog({
        namaUser: user?.nama || "Unknown",
        aksi: `${user?.nama || "User"} menghapus data Pre-Post Test (${
          dataToDelete?.title || id
        })`,
        dataTerkait: dataToDelete,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700">
          Data Pre-Post Test
        </h2>
        <button
          onClick={onAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm sm:text-base font-semibold shadow hover:bg-blue-700 active:scale-95 transition"
        >
          + Tambah Data
        </button>
      </div>

      {datasets.length === 0 ? (
        <p className="text-gray-500 text-sm">Belum ada data.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-[320px] sm:min-w-[600px] w-full text-sm border rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Judul</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">
                  Pre
                </th>
                <th className="px-3 py-2 text-left hidden md:table-cell">
                  Post
                </th>
                <th className="px-3 py-2 text-left">Peserta</th>
                <th className="px-3 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d.id} className="border-t">
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
                        onClick={() => onEdit(d)}
                        className="bg-yellow-500 text-white hover:bg-yellow-600 px-4 py-1.5 rounded text-xs font-semibold transition"
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
