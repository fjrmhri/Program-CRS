import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue, remove } from "firebase/database";
import FormModalMSE from "./FormModalMSE"; // pastikan ini diimpor jika belum

export default function DashboardMSE({ onAddForm, onView, onCompare }) {
  const [datasets, setDatasets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    const q = ref(db, "mse");
    return onValue(q, (snapshot) => {
      const data = snapshot.val() || {};
      const arr = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      arr.sort((a, b) => b.createdAt - a.createdAt);
      setDatasets(arr);
    });
  }, []);

  const handleEdit = (data) => {
    setEditData(data);
  };

  const handleDelete = (id) => {
    if (confirm("Yakin hapus data ini?")) {
      remove(ref(db, `mse/${id}`));
    }
  };

  const highlightMatch = (text = "", keyword = "") => {
    const regex = new RegExp(`(${keyword})`, "gi");
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: text.replace(
            regex,
            "<span class='bg-green-200 font-medium'>$1</span>"
          ),
        }}
      />
    );
  };

  const filteredDatasets = datasets.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.meta?.nama?.toLowerCase().includes(q) ||
      d.meta?.desa?.toLowerCase().includes(q) ||
      d.meta?.usaha?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="p-1 sm:p-2 md:p-4 bg-white shadow rounded">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="w-full sm:w-auto flex-1">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2">
              Monitoring MSE Offline
            </h2>
            <input
              type="text"
              placeholder="Cari nama, desa, atau produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={onAddForm}
              className="bg-green-600 text-white px-2 py-2 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded text-xs sm:text-sm md:text-base hover:bg-green-700 transition"
            >
              + Input Manual
            </button>
          </div>
        </div>

        {filteredDatasets.length === 0 ? (
          <p className="text-gray-500 text-sm">Tidak ada data yang cocok.</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-[470px] sm:min-w-[600px] w-full text-xs sm:text-sm border rounded">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 text-left">Nama UMKM</th>
                  <th className="px-2 py-2 text-left">Usaha/Produk</th>
                  <th className="px-2 py-2 text-left">Desa</th>
                  <th className="px-2 py-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredDatasets.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="px-2 py-2">
                      {highlightMatch(d.meta?.nama, searchQuery)}
                    </td>
                    <td className="px-2 py-2">
                      {highlightMatch(d.meta?.usaha, searchQuery)}
                    </td>
                    <td className="px-2 py-2">
                      {highlightMatch(d.meta?.desa, searchQuery)}
                    </td>
                    <td className="px-2 py-2">
                      <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
                        <button
                          onClick={() => onView(d)}
                          className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded text-xs sm:text-xs hover:bg-blue-100 transition w-full sm:w-auto"
                        >
                          Detail
                        </button>

                        <button
                          onClick={() => onCompare(d)}
                          className={`px-3 py-1.5 rounded text-[10px] sm:text-xs font-semibold transition w-full sm:w-auto ${
                            d.comparison
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-yellow-500 text-white hover:bg-yellow-600"
                          }`}
                        >
                          {d.comparison ? "Edit Perbandingan" : "Banding"}
                        </button>

                        <button
                          onClick={() => handleEdit(d)}
                          className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-xs sm:text-xs hover:bg-gray-200 transition w-full sm:w-auto"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(d.id)}
                          className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs sm:text-xs hover:bg-red-100 transition w-full sm:w-auto"
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

      {editData && (
        <FormModalMSE
          existingData={editData}
          onClose={() => setEditData(null)}
        />
      )}
    </>
  );
}
