import React, { useEffect, useMemo, useState } from "react";
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PencilSquareIcon,
  KeyIcon,
  ListBulletIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

// Firebase
import { auth, firestore, db } from "../../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  ref as rtdbRef,
  onValue,
  update as rtdbUpdate,
  remove as rtdbRemove,
  get as rtdbGet,
  child as rtdbChild,
} from "firebase/database";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

/**
 * DASHBOARD SETTING (ADMIN)
 * - Ringkasan profil admin
 * - Ubah profil admin (Firestore/collection `users/{phone}`)
 * - Ganti password admin (reauth + updatePassword)
 * - Log Aktivitas (Firestore/collection `activityLogs`)
 * - Kelola Akun Pelaku (Realtime DB `users/{uid}` + hitung bookkeeping/{uid})
 *   Catatan: Client SDK TIDAK bisa membuat/menghapus akun Authentication pengguna lain.
 *   Jadi di sini hanya kelola metadata (profil pelaku) + hapus data RTDB jika diperlukan.
 */

export default function DashboardSetting({ user, onLogout }) {
  // --- tabs
  const [tab, setTab] = useState("overview"); // overview | logs | pelaku

  // --- logs
  const [logs, setLogs] = useState([]);
  const [logSearch, setLogSearch] = useState("");

  // --- profile admin
  const safeName = user?.name || user?.nama || "";
  const [name, setName] = useState(safeName);
  const [phone, setPhone] = useState(user?.phone || "");
  const [showProfileModal, setShowProfileModal] = useState(false);

  // --- password admin
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // --- pelaku management
  const [pelaku, setPelaku] = useState([]); // array dari { uid, ...meta }
  const [pelakuLoading, setPelakuLoading] = useState(true);
  const [pelakuSearch, setPelakuSearch] = useState("");
  const [editingPelaku, setEditingPelaku] = useState(null); // {uid, ...}
  const [editMeta, setEditMeta] = useState({});

  // === Ambil Log Aktivitas ===
  useEffect(() => {
    const qy = query(
      collection(firestore, "activityLogs"),
      orderBy("timestamp", "desc")
    );
    const unsub = onSnapshot(qy, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // === Ambil data Pelaku (RTDB: users) + hitung bookkeeping count ===
  useEffect(() => {
    const usersRef = rtdbRef(db, "users");
    const unsub = onValue(usersRef, async (snap) => {
      const val = snap.val() || {};
      // val: { uid: { ...meta } }
      const uids = Object.keys(val);
      // prepare bookkeeping counts
      const results = await Promise.all(
        uids.map(async (uid) => {
          const meta = val[uid] || {};
          let bookkeepingCount = 0;
          try {
            const bookSnap = await rtdbGet(
              rtdbChild(rtdbRef(db), `bookkeeping/${uid}`)
            );
            if (bookSnap.exists()) {
              bookkeepingCount = Object.keys(bookSnap.val() || {}).length;
            }
          } catch (error) {
            console.error("Gagal menghitung data bookkeeping pelaku:", error);
          }
          return { uid, bookkeepingCount, ...meta };
        })
      );
      // sort by nama
      results.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
      setPelaku(results);
      setPelakuLoading(false);
    });
    return () => unsub();
  }, []);

  // === Helpers ===
  const fmtPhoneEmail = (p) => `${p}@dummy.com`;

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) =>
      `${l.user} ${l.action}`.toLowerCase().includes(q)
    );
  }, [logs, logSearch]);

  const filteredPelaku = useMemo(() => {
    const q = pelakuSearch.trim().toLowerCase();
    if (!q) return pelaku;
    return pelaku.filter((p) =>
      [p.nama, p.usaha, p.hp, p.desa, p.kota, p.estate]
        .map((x) => (x || "").toString().toLowerCase())
        .some((s) => s.includes(q))
    );
  }, [pelaku, pelakuSearch]);

  // === Simpan Perubahan Profil ADMIN (Firestore) ===
  const handleSaveProfile = async () => {
    try {
      if (!user?.phone) {
        alert(
          "ID dokumen Firestore tidak ditemukan (user.phone kosong). Pastikan skema user menyimpan phone sebagai docId."
        );
        return;
      }
      const ref = doc(firestore, "users", user.phone);
      await updateDoc(ref, { nama: name, name, phone });

      await addDoc(collection(firestore, "activityLogs"), {
        user: safeName || "(unknown)",
        action: `Update profil admin (nama/nomor HP)`,
        timestamp: new Date(),
      });

      alert("Profil admin berhasil diperbarui");
      setShowProfileModal(false);
    } catch (err) {
      alert("Gagal update profil: " + err.message);
    }
  };

  // === Ganti Password ADMIN (reauth + update) ===
  const handleChangePassword = async () => {
    try {
      if (!auth.currentUser) return;
      if (!oldPassword || !newPassword) {
        alert("Mohon isi password lama dan password baru.");
        return;
      }
      setPwLoading(true);
      const fakeEmail = fmtPhoneEmail(user?.phone);
      const credential = EmailAuthProvider.credential(fakeEmail, oldPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      await addDoc(collection(firestore, "activityLogs"), {
        user: safeName || "(unknown)",
        action: `Ganti password admin`,
        timestamp: new Date(),
      });

      alert("Password berhasil diganti");
      setOldPassword("");
      setNewPassword("");
      setShowPasswordModal(false);
    } catch (err) {
      alert("Gagal ganti password: " + (err?.message || ""));
    } finally {
      setPwLoading(false);
    }
  };

  // === Edit Profil PELAKU (RTDB users/{uid}) ===
  const openEditPelaku = (p) => {
    setEditingPelaku(p);
    setEditMeta({
      nama: p.nama || "",
      usaha: p.usaha || "",
      hp: p.hp || "",
      desa: p.desa || "",
      kota: p.kota || "",
      estate: p.estate || "",
      cdo: p.cdo || "",
      klasifikasi: p.klasifikasi || "",
    });
  };

  const savePelakuMeta = async () => {
    try {
      if (!editingPelaku?.uid) return;
      const targetRef = rtdbRef(db, `users/${editingPelaku.uid}`);
      await rtdbUpdate(targetRef, editMeta);

      await addDoc(collection(firestore, "activityLogs"), {
        user: safeName || "(unknown)",
        action: `Update profil pelaku (${
          editMeta?.nama || editingPelaku?.uid
        })`,
        timestamp: new Date(),
      });

      setEditingPelaku(null);
      alert("Profil pelaku tersimpan.");
    } catch (e) {
      alert("Gagal menyimpan: " + e.message);
    }
  };

  // === Hapus Data Pelaku (RTDB only) ===
  const deletePelakuData = async (p) => {
    const ok = confirm(
      `Hapus seluruh data pelaku di Realtime Database?\nNama: ${
        p.nama || "-"
      }\nUID: ${
        p.uid
      }\n\nCatatan: Ini tidak menghapus akun Authentication (email: ${
        p.hp
      }@umkm.local).`
    );
    if (!ok) return;
    try {
      await rtdbRemove(rtdbRef(db, `users/${p.uid}`));
      await rtdbRemove(rtdbRef(db, `bookkeeping/${p.uid}`));

      await addDoc(collection(firestore, "activityLogs"), {
        user: safeName || "(unknown)",
        action: `Hapus data pelaku (uid: ${p.uid}, nama: ${p.nama || "-"})`,
        timestamp: new Date(),
      });

      alert("Data pelaku dihapus dari RTDB.");
    } catch (e) {
      alert("Gagal menghapus: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-blue-700">
          Pengaturan & Manajemen
        </h2>
        <p className="text-gray-500 text-sm">
          Kelola akun admin, lihat log aktivitas, dan data pelaku
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow p-4 flex items-center gap-3">
          <UserCircleIcon className="h-10 w-10 text-blue-600" />
          <div>
            <p className="text-sm text-gray-500">Nama Admin</p>
            <p className="font-semibold text-gray-800">
              {safeName || "Pengguna"}
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow p-4 flex items-center gap-3">
          <Cog6ToothIcon className="h-10 w-10 text-green-600" />
          <div>
            <p className="text-sm text-gray-500">Nomor HP</p>
            <p className="font-semibold text-gray-800">{user?.phone || "-"}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow p-4 flex items-center gap-3">
          <ArrowRightOnRectangleIcon className="h-10 w-10 text-purple-600" />
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-semibold text-gray-800">Aktif</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-lg mx-auto mt-6 px-3 grid grid-cols-3 gap-3">
        <button
          onClick={() => setTab("overview")}
          className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm ${
            tab === "overview"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab("logs")}
          className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm ${
            tab === "logs"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Log Aktivitas
        </button>
        <button
          onClick={() => setTab("pelaku")}
          className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm ${
            tab === "pelaku"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Kelola Pelaku
        </button>
        <div className="flex-1" />
      </div>

      {/* === OVERVIEW: aksi cepat === */}
      {tab === "overview" && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            Aksi Cepat
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border hover:bg-gray-50 transition w-full sm:w-auto"
            >
              <PencilSquareIcon className="h-5 w-5 text-blue-600" /> Ubah Profil
              Admin
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border hover:bg-gray-50 transition w-full sm:w-auto"
            >
              <KeyIcon className="h-5 w-5 text-green-600" /> Ganti Password
              Admin
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center gap-2"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" /> Keluar
            </button>
          </div>
        </div>
      )}

      {/* === LOGS === */}
      {tab === "logs" && (
        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          <div className="flex items-center gap-2">
            <ListBulletIcon className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Log Aktivitas
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full max-w-sm">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
                placeholder="Cari nama / aksi..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto mt-2 divide-y">
            {filteredLogs.length === 0 ? (
              <p className="text-gray-500 text-sm">Belum ada aktivitas.</p>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="py-2 text-sm flex justify-between">
                  <span className="text-gray-800">
                    <b>{log.user}</b>: {log.action}
                  </span>
                  <span className="text-gray-400">
                    {new Date(
                      log.timestamp?.toDate?.() || log.timestamp
                    ).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* === PELAKU MANAGEMENT === */}
      {tab === "pelaku" && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Kelola Akun Pelaku
            </h3>
          </div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative w-full sm:max-w-sm">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
                placeholder="Cari nama/usaha/hp/desa/kota/estate"
                value={pelakuSearch}
                onChange={(e) => setPelakuSearch(e.target.value)}
              />
            </div>
            <div className="text-xs text-gray-500">
              Total: {pelaku.length} akun
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="p-2">Nama</th>
                  <th className="p-2">Usaha</th>
                  <th className="p-2">HP</th>
                  <th className="p-2">Lokasi</th>
                  <th className="p-2">Estate</th>
                  <th className="p-2">Klasifikasi</th>
                  <th className="p-2 text-center">Bookkeeping</th>
                  <th className="p-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pelakuLoading ? (
                  <tr>
                    <td className="p-3" colSpan={8}>
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredPelaku.length === 0 ? (
                  <tr>
                    <td className="p-3" colSpan={8}>
                      Tidak ada data.
                    </td>
                  </tr>
                ) : (
                  filteredPelaku.map((p) => (
                    <tr key={p.uid} className="hover:bg-gray-50">
                      <td className="p-2 font-medium">{p.nama || "-"}</td>
                      <td className="p-2">{p.usaha || "-"}</td>
                      <td className="p-2">{p.hp || "-"}</td>
                      <td className="p-2">
                        {[p.desa, p.kota].filter(Boolean).join(", ") || "-"}
                      </td>
                      <td className="p-2">{p.estate || "-"}</td>
                      <td className="p-2">{p.klasifikasi || "-"}</td>
                      <td className="p-2 text-center">
                        {p.bookkeepingCount || 0}
                      </td>
                      <td className="p-2">
                        <div className="flex justify-end gap-2">
                          <button
                            className="px-3 py-1 rounded-lg border hover:bg-gray-50 flex items-center gap-1"
                            onClick={() => openEditPelaku(p)}
                            title="Edit profil pelaku"
                          >
                            <PencilIcon className="h-4 w-4" /> Edit
                          </button>
                          <button
                            className="px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-1"
                            onClick={() => deletePelakuData(p)}
                            title="Hapus data RTDB pelaku"
                          >
                            <TrashIcon className="h-4 w-4" /> Hapus Data
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500">
            Catatan: Penghapusan di atas hanya menghapus data di Realtime
            Database (<code>users/</code> & <code>bookkeeping/</code>).
            Menghapus / mengganti password akun Authentication pelaku tidak bisa
            dilakukan dari client app admin tanpa Firebase Admin SDK.
          </p>
        </div>
      )}

      {/* === Modal Ubah Profil ADMIN === */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Ubah Profil Admin</h3>
            <input
              type="text"
              placeholder="Nama"
              className="w-full border px-3 py-2 rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Nomor HP"
              className="w-full border px-3 py-2 rounded"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 border rounded"
              >
                Batal
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Modal Ganti Password ADMIN === */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Ganti Password Admin</h3>
            <input
              type="password"
              placeholder="Password Lama"
              className="w-full border px-3 py-2 rounded"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password Baru"
              className="w-full border px-3 py-2 rounded"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 border rounded"
              >
                Batal
              </button>
              <button
                onClick={handleChangePassword}
                disabled={pwLoading}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                {pwLoading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Login admin menggunakan email tiruan:{" "}
              <code>{fmtPhoneEmail(user?.phone || "nomor")}</code>.
              Re-authentication dilakukan otomatis menggunakan password lama.
            </p>
          </div>
        </div>
      )}

      {/* === Modal Edit Pelaku === */}
      {editingPelaku && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl space-y-4">
            <h3 className="text-lg font-semibold">Edit Profil Pelaku</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["nama", "Nama"],
                ["usaha", "Usaha"],
                ["hp", "No. HP"],
                ["desa", "Desa"],
                ["kota", "Kota/Kab"],
                ["estate", "Estate"],
                ["klasifikasi", "Klasifikasi"],
                ["cdo", "CDO"],
              ].map(([key, label]) => (
                <div key={key} className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">{label}</label>
                  <input
                    className="border rounded px-3 py-2 text-sm"
                    value={editMeta[key] || ""}
                    onChange={(e) =>
                      setEditMeta((s) => ({ ...s, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setEditingPelaku(null)}
                className="px-4 py-2 border rounded"
              >
                Batal
              </button>
              <button
                onClick={savePelakuMeta}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Simpan
              </button>
            </div>
            <p className="text-xs text-gray-500">
              UID: {editingPelaku.uid} · Akun login pelaku:{" "}
              <code>{editingPelaku.hp || "nomor"}@umkm.local</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
