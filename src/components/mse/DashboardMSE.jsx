import React, { useEffect, useState, useCallback } from "react";
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
  const [refreshToggle, setRefreshToggle] = useState(false);

  const normalizeKey = (str) => (str || "").toString().trim().toLowerCase();

  const fetchAll = useCallback(() => {
    const bookkeepingRef = ref(db, "bookkeeping");
    const mseRef = ref(db, "mse");

    const allData = [];

    onValue(bookkeepingRef, (snapshot) => {
      const data = snapshot.val() || {};
      Object.entries(data).forEach(([uid, entries]) => {
        if (typeof entries !== "object") return;
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

        // Group by identity (nama-usaha) and merge to latest + comparison logic
        const grouped = groupBy(
          allData,
          (d) =>
            `${(d.meta?.nama || "").toString().toLowerCase()}|${(
              d.meta?.usaha || ""
            )
              .toString()
              .toLowerCase()}`
        );

        const merged = Object.values(grouped).map((items) => {
          // Keep only entries with at least a date or createdAt
          const valid = items.filter(
            (item) => item.meta?.tanggal || item.createdAt
          );

          // Sort by newest effective timestamp: compare combination of comparisonDate (if newer) and own date
          const computePrimaryDate = (item) => {
            const ownDate =
              item.meta?.tanggal || new Date(item.createdAt).toISOString();
            // if item has comparisonList (array) or comparison, consider its comparisonDate if newer
            let compDate = null;
            if (
              Array.isArray(item.comparisonList) &&
              item.comparisonList.length
            ) {
              // take the most recent comparisonList meta.tanggal among them
              const dates = item.comparisonList
                .map((c) => c.meta?.tanggal)
                .filter(Boolean)
                .map((d) => {
                  // normalize dd-mm-yyyy style
                  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
                    const [dd, mm, yyyy] = d.split("-");
                    return `${yyyy}-${mm}-${dd}`;
                  }
                  return d;
                });
              if (dates.length) {
                compDate = dates.sort((a, b) => new Date(b) - new Date(a))[0];
              }
            } else if (item.comparison) {
              compDate = item.comparisonDate || item.comparison?.meta?.tanggal;
            }
            // choose the later between compDate and ownDate
            if (compDate) {
              const cd = new Date(compDate);
              const od = new Date(ownDate);
              return cd > od ? compDate : ownDate;
            }
            return ownDate;
          };

          // sort so that latest (by effective) is first
          const sorted = valid
            .slice()
            .sort(
              (a, b) =>
                new Date(computePrimaryDate(b)) -
                new Date(computePrimaryDate(a))
            );

          const latest = sorted[0];
          const prev = sorted[1] || null;

          // Determine comparison object to pass into merged: support comparisonList, comparison, or fallback prev
          let comparison = null;
          // priority: if latest has comparisonList (array) use that as comparison entries
          if (
            Array.isArray(latest.comparisonList) &&
            latest.comparisonList.length
          ) {
            comparison = {
              comparisonList: latest.comparisonList.map((c) => ({
                monitoring: c.monitoring,
                meta: c.meta,
              })),
              metaFromComparison: null, // not used downstream
            };
          } else if (latest.source === "Manual" && latest.comparison) {
            comparison = {
              monitoring: latest.comparison,
              meta: latest.comparisonDate
                ? { tanggal: latest.comparisonDate }
                : latest.comparison?.meta || {},
            };
          } else if (prev) {
            comparison = {
              monitoring: prev.monitoring,
              meta: prev.meta,
            };
          }

          // compute effectiveDate: if comparison has tanggal and is newer, use it; else latest's own
          const latestDate = latest.meta?.tanggal || latest.createdAt;
          let comparisonDate = null;
          if (comparison) {
            if (comparison.comparisonList) {
              // take latest date from list
              const dates = comparison.comparisonList
                .map((c) => c.meta?.tanggal)
                .filter(Boolean)
                .map((d) => {
                  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
                    const [dd, mm, yyyy] = d.split("-");
                    return `${yyyy}-${mm}-${dd}`;
                  }
                  return d;
                });
              if (dates.length)
                comparisonDate = dates.sort(
                  (a, b) => new Date(b) - new Date(a)
                )[0];
            } else if (comparison.meta?.tanggal) {
              comparisonDate = comparison.meta.tanggal;
            }
          }
          let effectiveDate = latestDate;
          if (comparisonDate) {
            const ld = new Date(latestDate);
            const cd = new Date(comparisonDate);
            effectiveDate = cd > ld ? comparisonDate : latestDate;
          }

          // Normalize structure so consuming code downstream works same as before
          const result = {
            ...latest,
            effectiveDate,
          };

          if (comparison) {
            if (comparison.comparisonList) {
              result.comparisonList = comparison.comparisonList;
            } else if (comparison.monitoring) {
              result.comparison = comparison.monitoring;
              result.comparisonDate = comparison.meta?.tanggal;
            }
          } else {
            result.comparison = null;
          }

          return result;
        });

        const finalSorted = merged.sort(
          (a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate)
        );
        setDatasets(finalSorted);
      });
    });
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, refreshToggle]);

  const handleEdit = (data) => setEditData(data);

  const handleDelete = async (
    uidOrId,
    id,
    source = "bookkeeping",
    meta = {}
  ) => {
    if (!confirm("Yakin ingin menghapus SEMUA data UMKM ini?")) return;

    const { nama, usaha } = meta;
    const toDelete = [];

    const bookkeepingSnap = await new Promise((resolve) =>
      onValue(ref(db, "bookkeeping"), resolve, { onlyOnce: true })
    );
    const mseSnap = await new Promise((resolve) =>
      onValue(ref(db, "mse"), resolve, { onlyOnce: true })
    );

    const bookkeepingData = bookkeepingSnap.val() || {};
    const mseData = mseSnap.val() || {};

    Object.entries(bookkeepingData).forEach(([uid, entries]) => {
      if (typeof entries !== "object") return;
      Object.entries(entries).forEach(([entryId, entryVal]) => {
        if (entryVal.meta?.nama === nama && entryVal.meta?.usaha === usaha) {
          toDelete.push(ref(db, `bookkeeping/${uid}/${entryId}`));
        }
      });
    });

    Object.entries(mseData).forEach(([entryId, entryVal]) => {
      if (entryVal.meta?.nama === nama && entryVal.meta?.usaha === usaha) {
        toDelete.push(ref(db, `mse/${entryId}`));
      }
    });

    const deletePromises = toDelete.map((r) => remove(r));
    await Promise.all(deletePromises);

    alert("Semua data berhasil dihapus.");
    handleRefresh();
  };

  const handleRefresh = () => {
    setRefreshToggle((prev) => !prev);
  };

  const handleCompare = (d) => {
    const comparisonList = datasets
      .filter(
        (entry) =>
          normalizeKey(entry.meta?.nama) === normalizeKey(d.meta?.nama) &&
          normalizeKey(entry.meta?.usaha) === normalizeKey(d.meta?.usaha)
      )
      .map((e) => ({
        monitoring: e.monitoring,
        meta: e.meta,
        uid: e.uid,
      }));
    onCompare({
      ...d,
      comparisonList,
      datasets,
    });
  };
  // Tambahkan ini di atas fungsi handleShowChart
  const normalizeDate = (str) => {
    if (!str) return null;
    const cleaned = str.toString().trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(cleaned)) {
      const [d, m, y] = cleaned.split("-");
      return `${y}-${m}-${d}`;
    }
    return cleaned;
  };

  const handleShowChart = (d) => {
    // Normalisasi format tanggal ke yyyy-mm-dd
    const normalizeDate = (str) => {
      if (!str) return null;
      const cleaned = str.toString().trim();
      if (/^\d{2}-\d{2}-\d{4}$/.test(cleaned)) {
        const [dd, mm, yyyy] = cleaned.split("-");
        return `${yyyy}-${mm}-${dd}`;
      }
      return cleaned;
    };

    let comparisonList = [];

    if (d.source === "Manual") {
      // Ambil semua dari comparisonList jika ada
      if (Array.isArray(d.comparisonList)) {
        comparisonList.push(
          ...d.comparisonList.map((c) => ({
            monitoring: c.monitoring,
            meta: c.meta,
            uid: c.uid,
          }))
        );
      }

      // Data utama
      comparisonList.push({
        monitoring: d.monitoring,
        meta: d.meta,
        uid: d.uid,
      });

      // Jika ada comparison tunggal
      if (d.comparison && d.comparison.meta?.tanggal) {
        comparisonList.push({
          monitoring: d.comparison,
          meta: d.comparison.meta,
          uid: d.uid,
        });
      }
    } else {
      // Sumber Pelaku: ambil semua dari datasets dengan nama & usaha sama
      comparisonList = datasets
        .filter(
          (entry) =>
            normalizeKey(entry.meta?.nama) === normalizeKey(d.meta?.nama) &&
            normalizeKey(entry.meta?.usaha) === normalizeKey(d.meta?.usaha)
        )
        .map((e) => ({
          monitoring: e.monitoring,
          meta: e.meta,
          uid: e.uid,
        }));
    }

    // Urutkan berdasarkan tanggal lama → baru
    comparisonList.sort((a, b) => {
      const dateA = new Date(normalizeDate(a.meta?.tanggal));
      const dateB = new Date(normalizeDate(b.meta?.tanggal));
      return dateA - dateB;
    });

    setChartData({
      ...d,
      comparisonList,
      datasets,
    });
  };

  const handleExport = () => {
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

    datasets.forEach((dataEntry, index) => {
      const meta = dataEntry.meta || {};
      const monitoring = dataEntry.monitoring || [];

      const base = [
        index + 1,
        meta.nama || "-",
        meta.usaha || "-",
        meta.desa || "-",
        meta.tanggal || "-",
        dataEntry.source === "Manual" ? "Admin" : "Pelaku",
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
            "",
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

        for (let col = 0; col <= 5; col++) {
          merges.push({
            s: { r: rowOffset, c: col },
            e: { r: rowOffset + monitoringRows.length - 1, c: col },
          });
        }

        rowOffset += monitoringRows.length;
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = merges;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data MSE");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `DataMonitoringMSE.xlsx`);
  };

  const formatDate = (str) =>
    new Date(str).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

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
                onClick={handleExport}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 w-full sm:w-auto"
              >
                📥 Ekspor Excel
              </button>
              <button
                onClick={handleRefresh}
                className="bg-gray-500 text-white px-2 py-2 rounded text-sm hover:bg-gray-600"
              >
                🔄
              </button>
            </div>
          </div>
        </div>

        {filteredDatasets.length === 0 ? (
          <p className="text-gray-500 text-sm">Tidak ada data yang cocok.</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-[590px] sm:min-w-[600px] w-full text-xs sm:text-sm border rounded">
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
                      <div className="flex flex-col">
                        <span>{highlightMatch(d.meta?.nama, searchQuery)}</span>
                        <span className="text-[10px] text-gray-500 italic">
                          Terakhir Update:{" "}
                          {formatDate(
                            d.effectiveDate || d.meta?.tanggal || d.createdAt
                          )}
                        </span>
                      </div>
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
                            onClick={() => handleShowChart(d)}
                            className="bg-purple-500 text-white px-3 py-1.5 rounded text-xs hover:bg-purple-600"
                          >
                            Grafik
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleCompare(d)}
                              className="bg-yellow-500 text-white px-3 py-1.5 rounded text-xs hover:bg-yellow-600"
                            >
                              Banding
                            </button>
                            <button
                              onClick={() => handleShowChart(d)}
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
                            handleDelete(d.uid || d.id, d.id, d.source, d.meta)
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
