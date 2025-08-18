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

    if (meta?.tanggal) {
      raw.push({ meta, monitoring, source: "current" });
    }

    if (source === "Manual" && Array.isArray(comparisonList)) {
      comparisonList.forEach((cmp) => {
        if (cmp?.meta?.tanggal)
          raw.push({ meta: cmp.meta, monitoring: cmp.monitoring });
      });
    }

    if (source === "User") {
      (data.datasets || []).forEach((e) => {
        if (matchesIdentity(e.meta) && e.meta?.tanggal) {
          raw.push({ meta: e.meta, monitoring: e.monitoring });
        }
      });

      let countBk = 0;
      if (data.bookkeeping) {
        Object.values(data.bookkeeping).forEach((perUser) => {
          Object.values(perUser).forEach((entry) => {
            if (matchesIdentity(entry.meta) && entry.meta?.tanggal) {
              raw.push({ meta: entry.meta, monitoring: entry.monitoring });
              countBk++;
            }
          });
        });
      }

      if (countBk === 0 && bookkeepingFallback) {
        Object.values(bookkeepingFallback).forEach((entry) => {
          if (matchesIdentity(entry.meta) && entry.meta?.tanggal) {
            raw.push({ meta: entry.meta, monitoring: entry.monitoring });
          }
        });
      }
    }

    raw.sort(
      (a, b) =>
        new Date(normalizeDate(a.meta.tanggal)) -
        new Date(normalizeDate(b.meta.tanggal))
    );
    const seen = new Set();
    return raw.filter((e) => {
      const normDate = normalizeDate(e.meta?.tanggal);
      if (!normDate || seen.has(normDate)) return false;
      seen.add(normDate);
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
      const om = extract(mon, "Omset / penjualan per bulan");
      const bi = extractBiaya(mon);
      return {
        name: m.tanggal,
        Omset: om,
        Biaya: bi,
        Produksi: extract(mon, "Jumlah produksi per bulan"),
        TenagaTetap: sumTenaga(mon, "Jumlah tenaga kerja tetap"),
        TenagaTidakTetap: sumTenaga(mon, "Jumlah tenaga kerja tidak tetap"),
        Laba: om - bi,
      };
    })
    .filter((e) => e.name);

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
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start pt-10 overflow-y-auto">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-5xl w-full mx-2 space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-green-700">
            Grafik Perbandingan MSE
          </h2>
          <p className="text-gray-500 text-sm">
            Visualisasi omset, biaya, tenaga kerja, produksi, dan laba
          </p>
        </div>

        {/* Chart */}
        <div ref={chartRef} className="w-full h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={mapped}
              margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) =>
                  v >= 1_000_000 ? v / 1_000_000 + "jt" : v
                }
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                formatter={(v, n) => (n.includes("Tenaga") ? v : fmt(v))}
              />
              <Legend verticalAlign="top" height={36} />
              {[
                { key: "Omset", color: "#16a34a" },
                { key: "Biaya", color: "#ef4444" },
                { key: "Produksi", color: "#3b82f6" },
                { key: "TenagaTetap", color: "#9333ea" },
                { key: "TenagaTidakTetap", color: "#f59e0b" },
                { key: "Laba", color: "#0d9488" },
              ].map((l) => (
                <Line
                  key={l.key}
                  type="monotone"
                  dataKey={l.key}
                  stroke={l.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tabel Ringkasan */}
        <div className="overflow-x-auto text-sm">
          <table className="min-w-full border rounded-lg text-center">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 border">Kategori</th>
                {mapped.map((e, i) => (
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
                "Produksi",
                "TenagaTetap",
                "TenagaTidakTetap",
                "Laba",
              ].map((k, idx) => (
                <tr
                  key={k}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="p-2 border font-medium">{k}</td>
                  {mapped.map((e, i) => (
                    <td key={i} className="p-2 border">
                      {isNaN(e[k])
                        ? "-"
                        : k.includes("Tenaga") || k === "Produksi"
                        ? e[k]
                        : fmt(e[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button
            onClick={exportImage}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow hover:bg-blue-700 active:scale-95 transition w-full sm:w-auto"
          >
            Ekspor Gambar
          </button>
          <button
            onClick={exportPDF}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow hover:bg-green-700 active:scale-95 transition w-full sm:w-auto"
          >
            Ekspor PDF
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition w-full sm:w-auto"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
