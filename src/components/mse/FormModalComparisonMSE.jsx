import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { ref, update } from "firebase/database";

export default function FormModalComparisonMSE({ data, onClose }) {
  const [tanggal, setTanggal] = useState("");
  const [monitoring, setMonitoring] = useState([]);

  const clean = (val) => {
    const cleaned = (val || "").replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const format = (val) => {
    const num = parseFloat(
      (val || "").toString().replace(/\./g, "").replace(",", ".")
    );
    return isNaN(num) ? "" : num.toLocaleString("id-ID");
  };

  useEffect(() => {
    const initial = data.monitoring.map((mon) => ({
      uraian: mon.uraian,
      items: mon.items.map((item) => ({
        nama: item.nama,
        hasil: "",
      })),
    }));
    setMonitoring(initial);
  }, [data]);

  const recalculate = (draft) => {
    const updated = [...draft];
    const produksi = updated.find(
      (m) => m.uraian === "Jumlah produksi per bulan"
    );
    const biaya = updated.find(
      (m) => m.uraian === "Biaya operasional per bulan"
    );
    const omset = updated.find(
      (m) => m.uraian === "Omset / penjualan per bulan"
    );

    const totalProduksi =
      produksi?.items.reduce((s, i) => s + clean(i.hasil), 0) || 0;
    const totalBiaya =
      biaya?.items.reduce((s, i) => {
        if (i.nama === "Total") return s;
        return s + clean(i.hasil);
      }, 0) || 0;

    if (omset) omset.items[0].hasil = format(totalProduksi);
    if (biaya) {
      const idx = biaya.items.findIndex((i) => i.nama === "Total");
      if (idx !== -1) biaya.items[idx].hasil = format(totalBiaya);
    }

    return updated;
  };

  const handleItemChange = (monIdx, itemIdx, value) => {
    const copy = monitoring.map((m) => ({
      ...m,
      items: m.items.map((it, ii) => ({ ...it })),
    }));
    copy[monIdx].items[itemIdx].hasil = format(value);
    setMonitoring(recalculate(copy));
  };

  const handleAddItem = (monIdx) => {
    const cp = [...monitoring];
    cp[monIdx].items.push({ nama: "", hasil: "" });
    setMonitoring(cp);
  };

  const handleRemoveItem = (monIdx, itemIdx) => {
    const cp = [...monitoring];
    cp[monIdx].items.splice(itemIdx, 1);
    setMonitoring(cp);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formatted = monitoring.map((mon) => ({
      uraian: mon.uraian,
      items: mon.items.map((item) => ({
        nama: item.nama?.trim() || "-",
        hasil: clean(item.hasil).toString() || "0",
      })),
    }));

    await update(ref(db, `mse/${data.id}`), {
      comparison: formatted,
      comparisonDate: tanggal,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 z-50 overflow-y-auto">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-xl font-bold">
            Input Data Perbandingan Monitoring MSE
          </h2>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Tanggal Perbandingan Monitoring
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required
              className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {monitoring.map((mon, monIdx) => (
            <div
              key={monIdx}
              className="bg-gray-50 border rounded-lg p-4 shadow-sm space-y-4"
            >
              <h3 className="font-semibold text-gray-800">{mon.uraian}</h3>
              {mon.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="grid gap-4 items-center grid-cols-1 md:grid-cols-3"
                >
                  <input
                    type="text"
                    value={item.nama || ""}
                    disabled
                    className="border px-3 py-2 rounded w-full bg-gray-100"
                  />
                  <input
                    type="text"
                    value={item.hasil}
                    onChange={(e) =>
                      handleItemChange(monIdx, itemIdx, e.target.value)
                    }
                    placeholder="Hasil"
                    className={`border px-3 py-2 rounded w-full focus:outline-none focus:ring-yellow-400 ${
                      item.nama === "Total"
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}
                    readOnly={item.nama === "Total"}
                  />
                  <button
                    type="button"
                    disabled={mon.items.length === 1}
                    onClick={() => handleRemoveItem(monIdx, itemIdx)}
                    className="bg-red-100 text-red-700 px-3 py-2 rounded text-xs hover:bg-red-200"
                  >
                    Hapus
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddItem(monIdx)}
                className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded text-sm hover:bg-yellow-200"
              >
                + Tambah Item
              </button>
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="submit"
              className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600"
            >
              Simpan Perbandingan
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
