import React, { useState } from "react";
import { auth, firestore } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export default function Signup({ onSuccess }) {
  const [form, setForm] = useState({
    nama: "",
    jabatan: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Cek nomor telepon unik
    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("phone", "==", form.phone));
    const snap = await getDocs(q);
    if (!snap.empty) {
      setError("Nomor telepon sudah terdaftar.");
      setLoading(false);
      return;
    }

    // Gunakan email dummy untuk Auth (karena pakai phone sebagai username)
    const fakeEmail = `${form.phone}@dummy.com`;

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        fakeEmail,
        form.password
      );
      await setDoc(doc(usersRef, form.phone), {
        nama: form.nama,
        jabatan: form.jabatan,
        phone: form.phone,
        uid: userCred.user.uid,
        createdAt: Date.now(),
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-10 space-y-6 border border-gray-100"
      >
        <h2 className="text-2xl font-bold text-center text-green-700 mb-2 tracking-wide">
          Daftar Akun
        </h2>
        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-center">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium mb-1">Nama</label>
          <input
            name="nama"
            placeholder="Nama"
            value={form.nama}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-300 focus:outline-none transition"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium mb-1">
            Jabatan
          </label>
          <input
            name="jabatan"
            placeholder="Jabatan"
            value={form.jabatan}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-300 focus:outline-none transition"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium mb-1">
            Nomor Telepon
          </label>
          <input
            name="phone"
            placeholder="Nomor Telepon"
            value={form.phone}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-300 focus:outline-none transition"
            autoComplete="tel"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium mb-1">
            Password
          </label>
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-300 focus:outline-none transition"
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg shadow-md font-semibold hover:bg-green-700 active:scale-95 transition text-lg"
        >
          {loading ? "Mendaftar..." : "Daftar"}
        </button>
      </form>
    </div>
  );
}
