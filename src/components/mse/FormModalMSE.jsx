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
      { nama: "Laki‑laki", hasil: "" },
      { nama: "Perempuan", hasil: "" },
    ],
    allowAdd: false,
    defaultItems: ["Laki‑laki", "Perempuan"],
    showItem: true,
  },
  {
    uraian: "Jumlah tenaga kerja tidak tetap",
    items: [
      { nama: "Laki‑laki", hasil: "" },
      { nama: "Perempuan", hasil: "" },
    ],
    allowAdd: false,
    defaultItems: ["Laki‑laki", "Perempuan"],
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
    items: [{ nama: "Hasil rencana tindak lanjut masalah", hasil: "" }],
    allowAdd: true,
    defaultItems: ["Hasil rencana tindak lanjut masalah"],
    showItem: true,
  },
];

export default function FormModalMSE({ onClose, existingData }) {
  const isEdit = !!existingData;

  const [meta, setMeta] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    nama: "",
    usaha: "",
    hp: "",
    desa: "",
    kota: "",
    estate: "",
    cdo: "",
    klasifikasi: "",
    labaBersih: 0,
  });
  const [monitoring, setMonitoring] = useState(
    monitoringTemplate.map((m) => ({
      ...m,
      items: m.items.map((it) => ({ ...it, hasil: "" })),
    }))
  );

  const clean = (val) => {
    const cleaned = (val || "")
      .replace(/\./g, "") // Hapus titik (ribuan)
      .replace(",", "."); // Ganti koma dengan titik (decimal)
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const fmt = (num) => {
    if (isNaN(num)) return "";
    return num.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    if (isEdit && existingData.meta) {
      setMeta(existingData.meta);
      const merged = monitoringTemplate.map((tmpl) => {
        const ex = (existingData.monitoring || []).find(
          (m) => m.uraian === tmpl.uraian
        );
        return {
          ...tmpl,
          items: ex
            ? ex.items.map((it) => ({
                nama: it.nama,
                hasil: fmt(clean(it.hasil)),
              }))
            : tmpl.items.map((it) => ({ ...it, hasil: "" })),
        };
      });
      setMonitoring(merged);
    }
  }, [existingData, isEdit]);

  const onMeta = (e) => {
    setMeta((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const recalc = (mon) => {
    const prod = mon.find((m) => m.uraian === "Jumlah produksi per bulan");
    const biaya = mon.find((m) => m.uraian === "Biaya operasional per bulan");

    const totalProd = prod
      ? prod.items.reduce((s, it) => s + clean(it.hasil), 0)
      : 0;
    const sumBiaya =
      biaya?.items.reduce((s, it) => {
        if (it.nama === "Total") return s;
        return s + clean(it.hasil);
      }, 0) || 0;

    const newMon = mon.map((m) => {
      if (m.uraian === "Omset / penjualan per bulan") {
        return { ...m, items: [{ nama: null, hasil: fmt(totalProd) }] };
      }
      if (m.uraian === "Biaya operasional per bulan") {
        const items = m.items.map((it) =>
          it.nama === "Total" ? { nama: "Total", hasil: fmt(sumBiaya) } : it
        );
        return { ...m, items };
      }
      return m;
    });

    const laba = totalProd - sumBiaya;
    const UMK = 3692796;
    const MANDIRI = 15000000;
    const klas =
      laba < UMK ? "Tumbuh" : laba < MANDIRI ? "Berkembang" : "Mandiri";

    setMeta((p) => ({ ...p, labaBersih: laba, klasifikasi: klas }));
    return newMon;
  };

  const onItem = (mi, ii, field, val) => {
    const copy = monitoring.map((m) => ({
      ...m,
      items: m.items.map((it) => ({ ...it })),
    }));

    // Format hanya jika field 'hasil'
    if (field === "hasil") {
      const raw = clean(val);
      const formatted = fmt(raw);

      copy[mi].items[ii][field] = formatted;
    } else {
      copy[mi].items[ii][field] = val;
    }

    const updated = recalc(copy);
    setMonitoring(updated);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const id = isEdit ? existingData.id : uuidv4();
    const payload = {
      id,
      meta,
      monitoring: monitoring.map((m) => ({
        uraian: m.uraian,
        items: m.items.map((it) => ({
          nama: it.nama || "-",
          hasil: clean(it.hasil).toString(),
        })),
      })),
    };
    const refPath = ref(db, `mse/${id}`);
    await (isEdit ? update(refPath, payload) : set(refPath, payload));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-10 overflow-y-auto z-50">
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={onSubmit} className="space-y-6">
          <h2 className="text-2xl font-bold text-green-700 text-center mb-2">
            {isEdit ? "Edit Monitoring MSE" : "Input Monitoring MSE"}
          </h2>
          {/* Meta info fields (nama..cdo) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ["nama", "Nama pelaku/lembaga UMKM"],
              ["usaha", "Nama usaha / merk produk"],
              ["hp", "No. HP / WA Mitra"],
              ["desa", "Desa"],
              ["kota", "Kota/Kabupaten"],
              ["estate", "Estate"],
              ["cdo", "Nama CDO"],
            ].map(([k, lbl]) => (
              <div key={k} className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  {lbl}
                </label>
                <input
                  name={k}
                  value={meta[k] || ""}
                  onChange={onMeta}
                  required
                  className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-300"
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
                onChange={onMeta}
                required
                className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <label className="text-sm font-medium text-gray-700 mt-2">
                Klasifikasi Mitra
              </label>
              <input
                readOnly
                value={meta.klasifikasi || ""}
                className="border px-3 py-2 rounded w-full bg-gray-100"
              />
            </div>
          </div>

          {/* Monitoring fields */}
          <div className="space-y-6">
            {monitoring.map((mon, mi) => (
              <div
                key={mi}
                className="bg-gray-50 border rounded-lg p-4 shadow-sm"
              >
                <h3 className="font-semibold text-gray-800 mb-4">
                  {mon.uraian}
                </h3>
                <div className="space-y-4">
                  {mon.items.map((it, ii) => (
                    <div
                      key={ii}
                      className={`grid gap-4 items-center ${
                        mon.showItem ? "grid-cols-1 md:grid-cols-3" : ""
                      }`}
                    >
                      {mon.showItem && (
                        <input
                          type="text"
                          value={it.nama}
                          onChange={(e) =>
                            onItem(mi, ii, "nama", e.target.value)
                          }
                          disabled={mon.defaultItems.length > 0}
                          className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-1 focus:ring-green-300"
                          placeholder="Nama Item"
                          required={
                            mon.defaultItems.length === 0 && mon.showItem
                          }
                        />
                      )}
                      <input
                        type="text"
                        value={it.hasil}
                        onChange={(e) =>
                          onItem(mi, ii, "hasil", e.target.value)
                        }
                        className={`border px-3 py-2 rounded w-full focus:outline-none focus:ring-1 focus:ring-green-300 ${
                          ["Omset / penjualan per bulan", "Total"].includes(
                            it.nama
                          ) || mon.uraian === "Omset / penjualan per bulan"
                            ? "bg-gray-100 cursor-not-allowed"
                            : ""
                        }`}
                        readOnly={
                          mon.uraian === "Omset / penjualan per bulan" ||
                          it.nama === "Total"
                        }
                        placeholder="Nilai hasil"
                      />
                      {mon.allowAdd && mon.showItem && (
                        <button
                          type="button"
                          onClick={() => {
                            const cp = [...monitoring];
                            cp[mi].items.splice(ii, 1);
                            setMonitoring(recalc(cp));
                          }}
                          disabled={mon.items.length === 1}
                          className="bg-red-100 text-red-700 px-3 py-2 rounded text-xs hover:bg-red-200 transition"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  ))}
                  {mon.allowAdd && (
                    <button
                      type="button"
                      onClick={() => {
                        const cp = [...monitoring];
                        cp[mi].items.push({ nama: "", hasil: "" });
                        setMonitoring(recalc(cp));
                      }}
                      className="bg-green-100 text-green-700 px-4 py-2 rounded text-sm mt-2 hover:bg-green-200 transition"
                    >
                      + Tambah Item
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col md:flex-row justify-end gap-3 pt-4">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold shadow transition w-full md:w-auto"
            >
              {isEdit ? "Perbarui Data" : "Simpan"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-600 hover:underline w-full md:w-auto"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
