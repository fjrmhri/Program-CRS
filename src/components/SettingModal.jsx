import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";

export default function SettingModal({ user, onLogout, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil 20 log terakhir user ini
    const fetchLogs = async () => {
      setLoading(true);
      const q = query(
        collection(firestore, "logs"),
        orderBy("waktu", "desc"),
        limit(20)
      );
      const snap = await getDocs(q);
      setLogs(snap.docs.map((doc) => doc.data()));
      setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative animate-fadeIn space-y-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl transition"
          aria-label="Tutup"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-2 text-blue-700 text-center">
          Setting & Profil
        </h2>
        <div className="mb-4">
          <div className="font-semibold text-gray-700 mb-1">Profil User</div>
          <div className="text-sm text-gray-700 space-y-1">
            <div>
              Nama: <span className="font-medium">{user?.nama || "-"}</span>
            </div>
            <div>
              Jabatan:{" "}
              <span className="font-medium">{user?.jabatan || "-"}</span>
            </div>
            <div>
              No. Telepon:{" "}
              <span className="font-medium">{user?.phone || "-"}</span>
            </div>
          </div>
        </div>
        <div>
          <div className="font-semibold text-gray-700 mb-2">
            Log Aktivitas Terakhir
          </div>
          {loading ? (
            <div className="text-gray-500 text-sm">Memuat log...</div>
          ) : logs.length === 0 ? (
            <div className="text-gray-500 text-sm">Belum ada log.</div>
          ) : (
            <ul className="max-h-40 overflow-y-auto text-xs divide-y divide-gray-100">
              {logs.map((log, idx) => (
                <li key={idx} className="py-2">
                  <span className="font-medium">{log.namaUser}</span> —{" "}
                  {log.aksi}
                  <br />
                  <span className="text-gray-500">
                    {new Date(log.waktu).toLocaleString("id-ID")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={onLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg w-full font-semibold shadow transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
