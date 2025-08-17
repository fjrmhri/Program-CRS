import React, { useRef, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ref, get } from "firebase/database";
import { db } from "../../firebase";

export default function GrafikModalMSE({ data, onClose }) {
  const chartRef = useRef();
  const { meta, monitoring = [], comparisonList = [], uid, source } = data;
  const [bookkeepingFallback, setBookkeepingFallback] = useState(null);

  useEffect(() => {
    if (!uid) return;
    get(ref(db, `bookkeeping/${uid}`))
      .then((snap) => setBookkeepingFallback(snap.val() || {}))
      .catch(console.error);
  }, [uid]);

  const normalizeDate = (str) => {
    if (!str) return null;
    const cleaned = str.toString().trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(cleaned)) {
      const [d, m, y] = cleaned.split("-");
      return `${y}-${m}-${d}`;
    }
    return cleaned;
  };

  const normalizeKey = (str) => (str || "").toString().trim().toLowerCase();
  const matchesIdentity = (m2) =>
    normalizeKey(m2?.nama) === normalizeKey(meta?.nama) &&
    normalizeKey(m2?.usaha) === normalizeKey(meta?.usaha);

  const gatherComparisons = () => {
    const raw = [];

    // Data utama
    if (meta?.tanggal) {
      raw.push({
        meta,
        monitoring,
        source: "current",
      });
    }

    // Admin - semua dari comparisonList
    if (source === "Manual" && Array.isArray(comparisonList)) {
      comparisonList.forEach((cmp) => {
        if (cmp?.meta?.tanggal) {
          raw.push({
            meta: cmp.meta,
            monitoring: cmp.monitoring,
            source: "comparisonList",
          });
        }
      });
    }

    // Pelaku - dari datasets + bookkeeping
    if (source === "User") {
      (data.datasets || []).forEach((e) => {
        if (matchesIdentity(e.meta) && e.meta?.tanggal) {
          raw.push({
            meta: e.meta,
            monitoring: e.monitoring,
            source: "datasets",
          });
        }
      });

      let countBk = 0;
      if (data.bookkeeping) {
        Object.values(data.bookkeeping).forEach((perUser) => {
          Object.values(perUser).forEach((entry) => {
            if (matchesIdentity(entry.meta) && entry.meta?.tanggal) {
              raw.push({
                meta: entry.meta,
                monitoring: entry.monitoring,
                source: "bookkeeping(prop)",
              });
              countBk++;
            }
          });
        });
      }

      if (countBk === 0 && bookkeepingFallback) {
        Object.values(bookkeepingFallback).forEach((entry) => {
          if (matchesIdentity(entry.meta) && entry.meta?.tanggal) {
            raw.push({
              meta: entry.meta,
              monitoring: entry.monitoring,
              source: "bookkeeping(fb)",
            });
          }
        });
      }
    }

    // Urutkan lama → baru
    raw.sort(
      (a, b) =>
        new Date(normalizeDate(a.meta.tanggal)) -
        new Date(normalizeDate(b.meta.tanggal))
    );

    // Hapus entri tanpa tanggal & duplikat tanggal
    const seenDates = new Set();
    return raw.filter((e) => {
      if (!e.meta?.tanggal) return false;
      const normDate = normalizeDate(e.meta.tanggal);
      if (!normDate) return false;
      if (seenDates.has(normDate)) return false;
      seenDates.add(normDate);
      return true;
    });
  };

  const allComparisons = gatherComparisons();

  const clean = (v) => {
    const n = parseFloat((v || "").toString().replace(/[^\d.-]/g, ""));
    return isNaN(n) ? 0 : n;
  };

  const extract = (mon, u) =>
    clean(mon.find((m) => m.uraian === u)?.items?.[0]?.hasil);

  const extractBiaya = (mon) =>
    mon
      .find((m) => m.uraian === "Biaya operasional per bulan")
      ?.items?.reduce((s, i) => s + clean(i.hasil), 0) || 0;

  const sumTenaga = (mon, u) =>
    mon
      .find((m) => m.uraian === u)
      ?.items?.reduce((s, i) => s + clean(i.hasil), 0) || 0;

  const mapped = allComparisons
    .map(({ meta: m, monitoring: mon }) => {
      const raw = m.tanggal;
      const norm = normalizeDate(raw);
      const om = extract(mon, "Omset / penjualan per bulan");
      const bi = extractBiaya(mon);
      return {
        rawTanggal: raw,
        normalized: norm,
        Omset: om,
        Biaya: bi,
        Produksi: extract(mon, "Jumlah produksi per bulan"),
        TenagaTetap: sumTenaga(mon, "Jumlah tenaga kerja tetap"),
        TenagaTidakTetap: sumTenaga(mon, "Jumlah tenaga kerja tidak tetap"),
        Laba: om - bi,
      };
    })
    .filter((e) => e.normalized)
    .sort((a, b) => new Date(a.normalized) - new Date(b.normalized));

  // Ambil data terbaik per tanggal
  const byDate = {};
  const score = (e) => e.Omset * 10000 + e.Produksi * 100 + e.Laba;
  mapped.forEach((e) => {
    const k = e.normalized;
    if (!byDate[k] || score(e) > score(byDate[k])) byDate[k] = e;
  });

  const chartData = Object.values(byDate)
    .sort((a, b) => new Date(a.normalized) - new Date(b.normalized))
    .map((e) => ({
      name: e.rawTanggal,
      Omset: e.Omset,
      Biaya: e.Biaya,
      Produksi: e.Produksi,
      TenagaTetap: e.TenagaTetap,
      TenagaTidakTetap: e.TenagaTidakTetap,
      Laba: e.Laba,
    }));

  const fmt = (v) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(v);

  const exportImage = async () => {
    const canvas = await html2canvas(chartRef.current);
    const a = document.createElement("a");
    a.download = `grafik_${Date.now()}.png`;
    a.href = canvas.toDataURL();
    a.click();
  };

  const exportPDF = async () => {
    const canvas = await html2canvas(chartRef.current);
    const pdf = new jsPDF("landscape");
    pdf.addImage(canvas.toDataURL(), "PNG", 10, 10, 280, 150);
    pdf.save(`grafik_${Date.now()}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-start pt-10 overflow-y-auto">
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl max-w-4xl w-full mx-2 space-y-6 animate-fadeIn">
        <h2 className="text-2xl font-bold text-green-700 text-center">
          Grafik Perbandingan MSE
        </h2>

        <div ref={chartRef} className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(v) =>
                  v >= 1_000_000 ? v / 1_000_000 + "jt" : v
                }
              />
              {/* <Tooltip formatter={(v) => fmt(v)} /> */}
              <Legend />
              {[
                "Omset",
                "Produksi",
                "Biaya",
                "TenagaTetap",
                "TenagaTidakTetap",
                "Laba",
              ].map((k, i) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  strokeWidth={2}
                  stroke={
                    [
                      "#4CAF50",
                      "#2196F3",
                      "#FF9800",
                      "#9C27B0",
                      "#795548",
                      "#009688",
                    ][i]
                  }
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto text-sm">
          <table className="min-w-full border text-center rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Kategori</th>
                {chartData.map((e, i) => (
                  <th key={i} className="p-2 border">
                    {e.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                "Omset",
                "Biaya",
                "TenagaTetap",
                "TenagaTidakTetap",
                "Laba",
              ].map((k) => (
                <tr key={k} className="border-t">
                  <td className="p-2 border font-medium">{k}</td>
                  {chartData.map((e, i) => (
                    <td key={i} className="p-2 border">
                      {isNaN(e[k])
                        ? "-"
                        : k.includes("Tenaga")
                        ? e[k]
                        : fmt(e[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
          <button
            onClick={exportImage}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow hover:bg-blue-700 active:scale-95 transition w-full sm:w-auto"
          >
            📷 Ekspor Gambar
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-600 hover:underline w-full sm:w-auto"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
