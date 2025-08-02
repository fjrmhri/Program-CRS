import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue, remove } from "firebase/database";
import FormModalMSE from "./FormModalMSE";
import GrafikModalMSE from "./GrafikModalMSE";
import groupBy from "lodash/groupBy";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function DashboardMSE({ onAddForm, onView, onCompare }) {
  const [datasets, setDatasets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editData, setEditData] = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const bookkeepingRef = ref(db, "bookkeeping");
    const mseRef = ref(db, "mse");

    const fetchData = () => {
      const allData = [];

      onValue(bookkeepingRef, (snapshot) => {
        const data = snapshot.val() || {};
        Object.entries(data).forEach(([uid, entries]) => {
          Object.entries(entries).forEach(([id, value]) => {
            allData.push({
              ...value,
              id,
              uid,
              source: "User",
              createdAt: value.createdAt || 0,
            });
          });
        });

        onValue(mseRef, (snap2) => {
          const data2 = snap2.val() || {};
          Object.entries(data2).forEach(([id, val]) => {
            allData.push({
              ...val,
              id,
              source: "Manual",
              createdAt: val.createdAt || 0,
            });
          });

          const grouped = groupBy(
            allData,
            (d) => `${d.meta?.nama || ""}-${d.meta?.usaha || ""}`
          );

          const merged = Object.values(grouped).map((items) => {
            const sorted = items
              .filter((item) => item.meta?.tanggal || item.createdAt)
              .sort((a, b) => {
                const aDate =
                  a.meta?.tanggal || new Date(a.createdAt).toISOString();
                const bDate =
                  b.meta?.tanggal || new Date(b.createdAt).toISOString();
                return bDate.localeCompare(aDate);
              });

            const latest = sorted[0];

            // jika data Manual dan punya comparison di dalamnya
            const hasInlineComparison =
              latest.source === "Manual" && latest.comparison;

            return {
              ...latest,
              comparison: hasInlineComparison
                ? {
                    monitoring: latest.comparison,
                    meta: {
                      tanggal: latest.comparisonDate || "Sebelumnya",
                      labaBersih: latest.meta?.labaBersih || "0",
                    },
                  }
                : sorted[1]
                ? {
                    monitoring: sorted[1].monitoring,
                    meta: sorted[1].meta,
                  }
                : null,
            };
          });

          // Urutkan hasil akhir berdasarkan tanggal terbaru
          const finalSorted = merged.sort((a, b) => {
            const aDate =
              a.meta?.tanggal || new Date(a.createdAt).toISOString();
            const bDate =
              b.meta?.tanggal || new Date(b.createdAt).toISOString();
            return bDate.localeCompare(aDate);
          });

          setDatasets(finalSorted);
        });
      });
    };

    fetchData();
  }, []);

  const handleEdit = (data) => setEditData(data);

  const handleDelete = (uidOrId, id, source = "bookkeeping") => {
    if (confirm("Yakin hapus data ini?")) {
      const path =
        source === "User" ? `bookkeeping/${uidOrId}/${id}` : `mse/${id}`;
      remove(ref(db, path));
    }
  };

  const exportExcel = () => {
    const wsData = [
      [
        "No",
        "Nama",
        "Usaha",
        "Desa",
        "Tanggal",
        "Sumber",
        "Uraian",
        "Item",
        "Hasil",
      ],
    ];

    const merges = [];
    let rowOffset = 1;

    datasets.forEach((data, index) => {
      const meta = data.meta || {};
      const monitoring = data.monitoring || [];

      const base = [
        index + 1,
        meta.nama || "-",
        meta.usaha || "-",
        meta.desa || "-",
        meta.tanggal || "-",
        data.source === "Manual" ? "Admin" : "Pelaku",
      ];

      const monitoringRows = [];

      monitoring.forEach((mon) => {
        const items = mon.items || [];

        items.forEach((item, j) => {
          monitoringRows.push([
            "",
            "",
            "",
            "",
            "",
            "", // base kosong (kita isi nanti hanya 1x)
            j === 0 ? mon.uraian : "",
            item.nama || "-",
            item.hasil || "-",
          ]);
        });

        if (items.length > 1) {
          merges.push({
            s: { r: rowOffset, c: 6 },
            e: { r: rowOffset + items.length - 1, c: 6 },
          });
        }
      });

      // Tambahkan base hanya di baris pertama
      if (monitoringRows.length > 0) {
        for (let i = 0; i < monitoringRows.length; i++) {
          if (i === 0) {
            wsData.push([...base, ...monitoringRows[i].slice(6)]);
          } else {
            wsData.push([
              "",
              "",
              "",
              "",
              "",
              "",
              ...monitoringRows[i].slice(6),
            ]);
          }
        }

        // Merge kolom No–Sumber
        for (let col = 0; col <= 5; col++) {
          merges.push({
            s: { r: rowOffset, c: col },
            e: { r: rowOffset + monitoringRows.length - 1, c: col },
          });
        }

        rowOffset += monitoringRows.length;
      }
    });

    // Create worksheet and apply merges
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = merges;

    // Optional: Apply header styles if needed
    const headerRow = ws["A1:E1"];
    if (headerRow) {
      for (let i = 0; i < 9; i++) {
        ws[`A1`].s = {
          fill: { fgColor: { rgb: "FFFF00" } }, // Example: Yellow background
          font: { bold: true },
        };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data MSE");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `DataMonitoringMSE.xlsx`);
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
              Monitoring Pembukuan UMKM
            </h2>
            <input
              type="text"
              placeholder="Cari nama, desa, atau produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-end w-full gap-2 sm:w-auto sm:flex-nowrap">
            <div className="flex flex-row justify-between gap-2 w-full sm:w-auto">
              <button
                onClick={onAddForm}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 w-full sm:w-auto"
              >
                + Input Manual
              </button>
              <button
                onClick={exportExcel}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 w-full sm:w-auto"
              >
                📥 Ekspor Excel
              </button>
            </div>
          </div>
        </div>

        {filteredDatasets.length === 0 ? (
          <p className="text-gray-500 text-sm">Tidak ada data yang cocok.</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-[560px] sm:min-w-[600px] w-full text-xs sm:text-sm border rounded">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 text-left">Nama UMKM</th>
                  <th className="px-2 py-2 text-left">Usaha/Produk</th>
                  <th className="px-2 py-2 text-left">Desa</th>
                  <th className="px-2 py-2 text-left">Sumber</th>
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
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          d.source === "Manual"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {d.source === "Manual" ? "Admin" : "Pelaku"}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
                        <button
                          onClick={() => onView(d)}
                          className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded text-xs hover:bg-blue-100"
                        >
                          Detail
                        </button>

                        {d.source === "User" ? (
                          <button
                            onClick={() => setChartData(d)}
                            className="bg-purple-500 text-white px-3 py-1.5 rounded text-xs hover:bg-purple-600"
                          >
                            Grafik
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => onCompare(d)}
                              className="bg-yellow-500 text-white px-3 py-1.5 rounded text-xs hover:bg-yellow-600"
                            >
                              Banding
                            </button>
                            <button
                              onClick={() => setChartData(d)}
                              className="bg-purple-500 text-white px-3 py-1.5 rounded text-xs hover:bg-purple-600"
                            >
                              Grafik
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleEdit(d)}
                          className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-xs hover:bg-gray-200"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(d.uid || d.id, d.id, d.source)
                          }
                          className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs hover:bg-red-100"
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

      {chartData && (
        <GrafikModalMSE data={chartData} onClose={() => setChartData(null)} />
      )}
    </>
  );
}
