import React, { useEffect, useState } from "react";
import { onValue, ref, remove, set, update } from "firebase/database";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { db } from "../../firebase";
import {
  UserCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [password, setPassword] = useState("");

  useEffect(() => {
    const userRef = ref(db, "users");
    onValue(userRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([uid, meta]) => ({
        uid,
        ...meta,
      }));
      setUsers(list);
    });
  }, []);

  const handleEdit = (user) => {
    setSelected(user);
    setForm(user);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    await update(ref(db, `users/${selected.uid}`), form);
    alert("Data user berhasil diupdate");
    setSelected(null);
  };

  const handleDelete = async (uid) => {
    if (!window.confirm("Yakin hapus akun ini?")) return;
    await remove(ref(db, `users/${uid}`));
    alert(
      "User dihapus dari database. (NB: Auth perlu hapus manual via Firebase Console)"
    );
  };

  const handleAddUser = async () => {
    try {
      const auth = getAuth();
      const email = `${form.hp}@umkm.local`;
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCred.user.uid;
      await set(ref(db, `users/${uid}`), { ...form, createdAt: Date.now() });
      alert("User baru berhasil ditambahkan");
      setForm({});
      setPassword("");
    } catch (err) {
      alert("Gagal menambah user: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-blue-700">Kelola Akun User</h2>

      {/* List Users */}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Daftar User</h3>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Nama</th>
              <th className="p-2">Usaha</th>
              <th className="p-2">HP</th>
              <th className="p-2">Desa</th>
              <th className="p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid} className="border-t">
                <td className="p-2">{u.nama}</td>
                <td className="p-2">{u.usaha}</td>
                <td className="p-2">{u.hp}</td>
                <td className="p-2">{u.desa}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => handleEdit(u)}
                    className="px-2 py-1 bg-blue-500 text-white rounded flex items-center gap-1"
                  >
                    <PencilSquareIcon className="h-4 w-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(u.uid)}
                    className="px-2 py-1 bg-red-500 text-white rounded flex items-center gap-1"
                  >
                    <TrashIcon className="h-4 w-4" /> Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Edit / Tambah */}
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <h3 className="text-lg font-semibold">
          {selected ? "Edit User" : "Tambah User"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {["nama", "usaha", "hp", "desa", "kota", "estate", "cdo"].map(
            (field) => (
              <input
                key={field}
                type="text"
                placeholder={field}
                value={form[field] || ""}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            )
          )}
          {!selected && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded col-span-full"
            />
          )}
        </div>
        <div className="flex gap-2">
          {selected ? (
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Simpan Perubahan
            </button>
          ) : (
            <button
              onClick={handleAddUser}
              className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2"
            >
              <PlusCircleIcon className="h-5 w-5" /> Tambah User
            </button>
          )}
          {selected && (
            <button
              onClick={() => setSelected(null)}
              className="px-4 py-2 border rounded"
            >
              Batal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
