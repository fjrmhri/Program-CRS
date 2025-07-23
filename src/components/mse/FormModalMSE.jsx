import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { ref, set, update } from "firebase/database";
import { v4 as uuidv4 } from "uuid";

const monitoringTemplate = [
  {
    uraian: "Jumlah produksi per bulan",
    items: [{ nama: "", hasil: "" }],
    allowAdd: true,
    defaultItems: [],
    showItem: true,
  },
  {
    uraian: "Jumlah tenaga kerja tetap",
    items: [
      { nama: "Laki-laki", hasil: "" },
      { nama: "Perempuan", hasil: "" },
    ],
    allowAdd: false,
    defaultItems: ["Laki-laki", "Perempuan"],
    showItem: true,
  },
  {
    uraian: "Jumlah tenaga kerja tidak tetap",
    items: [
      { nama: "Laki-laki", hasil: "" },
      { nama: "Perempuan", hasil: "" },
    ],
    allowAdd: false,
    defaultItems: ["Laki-laki", "Perempuan"],
    showItem: true,
  },
  {
    uraian: "Omset / penjualan per bulan",
    items: [{ nama: null, hasil: "" }],
    allowAdd: false,
    defaultItems: [],
    showItem: false,
  },
  {
    uraian: "Biaya operasional per bulan",
    items: [
      { nama: "Bahan baku", hasil: "" },
      { nama: "Tenaga kerja", hasil: "" },
      { nama: "Listrik", hasil: "" },
      { nama: "Lainnya(sebutkan)", hasil: "" },
      { nama: "Total", hasil: "" },
    ],
    allowAdd: true,
    defaultItems: ["Bahan baku", "Tenaga kerja", "Listrik", "Lainnya"],
    showItem: true,
  },
  {
    uraian: "Masalah yang dihadapi",
    items: [
      { nama: "Permasalahan", hasil: "" },
      { nama: "Rencana tindak lanjut", hasil: "" },
    ],
    allowAdd: true,
    defaultItems: ["Permasalahan", "Rencana tindak lanjut"],
    showItem: true,
  },
  {
    uraian: "Hasil tindak lanjut dari monitoring sebelumnya",
    items: [
      {
        nama: "Hasil rencana tindak lanjut masalah",
        hasil: "",
      },
    ],
    allowAdd: true,
    defaultItems: ["Hasil rencana tindak lanjut masalah "],
    showItem: true,
  },
];

export default function FormModalMSE({ onClose, existingData }) {
  const [meta, setMeta] = useState({
    tanggal: "",
    nama: "",
    usaha: "",
    hp: "",
    desa: "",
    kota: "",
    estate: "",
    cdo: "",
    klasifikasi: "",
  });
  const [monitoring, setMonitoring] = useState(monitoringTemplate);
  const isEditMode = !!existingData;

  useEffect(() => {
    if (existingData) {
      setMeta(existingData.meta || {});

      // Gabungkan struktur monitoring lama dengan template
      const mergedMonitoring = monitoringTemplate.map((templateMon) => {
        const existingMon = (existingData.monitoring || []).find(
          (mon) => mon.uraian === templateMon.uraian
        );
        return {
          ...templateMon,
          items: existingMon?.items || templateMon.items,
        };
      });

      setMonitoring(mergedMonitoring);
    }
  }, [existingData]);

  const handleMetaChange = (e) => {
    setMeta({ ...meta, [e.target.name]: e.target.value });
  };

  const formatNumber = (value) => {
    const match = value.match(/^([\d,.]+)(.*)$/);
    if (!match) return value;
    const rawNumber = match[1].replace(/[^0-9]/g, "");
    const suffix = match[2] || "";
    const formattedNumber = rawNumber
      ? Number(rawNumber).toLocaleString("id-ID")
      : "";
    return formattedNumber + suffix;
  };

  const handleItemChange = (monIdx, itemIdx, field, value) => {
    const updated = [...monitoring];
    updated[monIdx].items[itemIdx][field] =
      field === "hasil" ? formatNumber(value) : value;
    setMonitoring(updated);
  };

  const handleAddItem = (monIdx) => {
    const updated = [...monitoring];
    updated[monIdx].items.push({ nama: "", hasil: "" });
    setMonitoring(updated);
  };

  const handleRemoveItem = (monIdx, itemIdx) => {
    const updated = [...monitoring];
    updated[monIdx].items.splice(itemIdx, 1);
    setMonitoring(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = isEditMode ? existingData.id : uuidv4();

    const monitoringData = monitoring.map((mon) => ({
      uraian: mon.uraian,
      items: mon.items.map((item) => ({
        nama: item.nama?.trim() || "-",
        hasil: item.hasil?.trim() || "-",
      })),
    }));

    const metaData = Object.fromEntries(
      Object.entries(meta).map(([k, v]) => [k, v.trim() !== "" ? v : "-"])
    );

    const payload = {
      id,
      meta: metaData,
      monitoring: monitoringData,
      ...(isEditMode ? {} : { createdAt: Date.now() }),
    };

    const targetRef = ref(db, `mse/${id}`);
    await (isEditMode ? update(targetRef, payload) : set(targetRef, payload));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 overflow-y-auto z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-xl font-bold">
            {isEditMode ? "Edit Monitoring MSE" : "Input Monitoring MSE"}
          </h2>

          {/* Informasi UMKM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ["nama", "Nama pelaku/lembaga UMKM"],
              ["usaha", "Nama usaha / merk produk"],
              ["hp", "No. HP / WA Mitra"],
              ["desa", "Desa"],
              ["kota", "Kota/Kabupaten"],
              ["estate", "Estate"],
              ["cdo", "Nama CDO"],
            ].map(([key, label]) => (
              <div key={key} className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                <input
                  name={key}
                  value={meta[key]}
                  onChange={handleMetaChange}
                  className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-300"
                  required
                />
              </div>
            ))}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Tanggal Monitoring
              </label>
              <input
                type="date"
                name="tanggal"
                value={meta.tanggal || ""}
                onChange={handleMetaChange}
                className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-300"
                required
              />
              <label className="text-sm font-medium text-gray-700 mb-1">
                Klasifikasi Mitra
              </label>
              <select
                name="klasifikasi"
                value={meta.klasifikasi || ""}
                onChange={handleMetaChange}
                className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-300"
                required
              >
                <option value="">Pilih klasifikasi</option>
                <option value="Pemula">Tumbuh</option>
                <option value="Berkembang">Berkembang</option>
                <option value="Maju">Mandiri</option>
              </select>
            </div>
          </div>

          {/* Monitoring */}
          <div className="space-y-6">
            {monitoring.map((mon, monIdx) => (
              <div
                key={monIdx}
                className="bg-gray-50 border rounded-lg p-4 shadow-sm"
              >
                <h3 className="font-semibold text-gray-800 mb-4">
                  {mon.uraian}
                </h3>
                <div className="space-y-4">
                  {mon.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className={`grid gap-4 items-center ${
                        mon.showItem ? "grid-cols-1 md:grid-cols-3" : ""
                      }`}
                    >
                      {mon.showItem && (
                        <input
                          type="text"
                          value={item.nama || ""}
                          onChange={(e) =>
                            handleItemChange(
                              monIdx,
                              itemIdx,
                              "nama",
                              e.target.value
                            )
                          }
                          className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-1 focus:ring-green-300"
                          placeholder="Nama Item"
                          required={
                            mon.defaultItems.length === 0 && mon.showItem
                          }
                          disabled={mon.defaultItems.length > 0}
                        />
                      )}

                      {[
                        "Masalah yang dihadapi",
                        "Hasil tindak lanjut dari monitoring sebelumnya",
                      ].includes(mon.uraian) ? (
                        <textarea
                          value={item.hasil || ""}
                          onChange={(e) =>
                            handleItemChange(
                              monIdx,
                              itemIdx,
                              "hasil",
                              e.target.value
                            )
                          }
                          rows={3}
                          className="border px-3 py-2 rounded w-full resize-y focus:outline-none focus:ring-1 focus:ring-green-300"
                          placeholder="Penjelasan hasil"
                        />
                      ) : (
                        <input
                          type="text"
                          value={item.hasil || ""}
                          onChange={(e) =>
                            handleItemChange(
                              monIdx,
                              itemIdx,
                              "hasil",
                              e.target.value
                            )
                          }
                          className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-1 focus:ring-green-300"
                          placeholder="Nilai hasil"
                        />
                      )}

                      {mon.allowAdd && mon.showItem && (
                        <button
                          type="button"
                          className="bg-red-100 text-red-700 px-3 py-2 rounded text-xs hover:bg-red-200 transition"
                          onClick={() => handleRemoveItem(monIdx, itemIdx)}
                          disabled={mon.items.length === 1}
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  ))}

                  {mon.allowAdd && mon.showItem && (
                    <button
                      type="button"
                      className="bg-green-100 text-green-700 px-4 py-2 rounded text-sm mt-2 hover:bg-green-200 transition"
                      onClick={() => handleAddItem(monIdx)}
                    >
                      + Tambah Item
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Aksi */}
          <div className="flex flex-col md:flex-row justify-end gap-3 pt-4">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
            >
              {isEditMode ? "Perbarui Data" : "Simpan"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-600 hover:underline"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
