import React, { useState, useEffect } from "react";
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PencilSquareIcon,
  KeyIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { auth, firestore } from "../../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { updatePassword } from "firebase/auth";

export default function DashboardSetting({ user, onLogout }) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [newPassword, setNewPassword] = useState("");

  // === Ambil Log Aktivitas ===
  useEffect(() => {
    const q = query(
      collection(firestore, "activityLogs"),
      orderBy("timestamp", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // === Simpan Perubahan Profil ===
  const handleSaveProfile = async () => {
    try {
      if (!user?.phone) return;
      const ref = doc(firestore, "users", user.phone);
      await updateDoc(ref, { name, phone });

      await addDoc(collection(firestore, "activityLogs"), {
        user: user.name,
        action: `Update profil (nama/nomor HP)`,
        timestamp: new Date(),
      });

      alert("Profil berhasil diperbarui");
      setShowProfileModal(false);
    } catch (err) {
      alert("Gagal update profil: " + err.message);
    }
  };

  // === Ganti Password ===
  const handleChangePassword = async () => {
    try {
      if (!auth.currentUser) return;
      await updatePassword(auth.currentUser, newPassword);

      await addDoc(collection(firestore, "activityLogs"), {
        user: user.name,
        action: `Ganti password`,
        timestamp: new Date(),
      });

      alert("Password berhasil diganti");
      setNewPassword("");
      setShowPasswordModal(false);
    } catch (err) {
      alert("Gagal ganti password: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-blue-700">Pengaturan Akun</h2>
        <p className="text-gray-500 text-sm">
          Kelola akun Anda dan preferensi aplikasi
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow p-4 flex items-center gap-3">
          <UserCircleIcon className="h-10 w-10 text-blue-600" />
          <div>
            <p className="text-sm text-gray-500">Nama</p>
            <p className="font-semibold text-gray-800">
              {user?.name || "Pengguna"}
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

      {/* Setting Actions */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Aksi Cepat
        </h3>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-lg border hover:bg-gray-50 transition"
          >
            <PencilSquareIcon className="h-5 w-5 text-blue-600" />
            Ubah Profil
          </button>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-lg border hover:bg-gray-50 transition"
          >
            <KeyIcon className="h-5 w-5 text-green-600" />
            Ganti Password
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 transition"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
          <ListBulletIcon className="h-5 w-5 text-purple-600" />
          Log Aktivitas
        </h3>
        <div className="max-h-60 overflow-y-auto mt-3">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm">Belum ada aktivitas.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="border-b pb-1 flex justify-between text-gray-700"
                >
                  <span>
                    <b>{log.user}</b>: {log.action}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {new Date(
                      log.timestamp?.toDate?.() || log.timestamp
                    ).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* === Modal Ubah Profil === */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Ubah Profil</h3>
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

      {/* === Modal Ganti Password === */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Ganti Password</h3>
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
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
