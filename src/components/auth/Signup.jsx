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
import logo from "../../assets/logo.PNG";

export default function Signup({ onSuccess, setPage }) {
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

    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("phone", "==", form.phone));
    const snap = await getDocs(q);
    if (!snap.empty) {
      setError("Nomor telepon sudah terdaftar.");
      setLoading(false);
      return;
    }

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
      setError("Registrasi gagal. Silakan coba lagi.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo" className="h-20 mb-3" />
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            Daftar Akun Baru
          </h2>
          <p className="text-gray-600 text-base">
            Isi data Anda untuk membuat akun
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm text-center mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Nama
            </label>
            <input
              name="nama"
              value={form.nama}
              onChange={handleChange}
              required
              placeholder="Masukkan nama"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-400 focus:outline-none transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Jabatan
            </label>
            <input
              name="jabatan"
              value={form.jabatan}
              onChange={handleChange}
              required
              placeholder="Masukkan jabatan"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-400 focus:outline-none transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Nomor Telepon
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              placeholder="Masukkan nomor telepon"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-400 focus:outline-none transition"
              autoComplete="tel"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Masukkan password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-400 focus:outline-none transition"
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          {/* Tombol Signup */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
          >
            {loading ? "Mendaftar..." : "Daftar"}
          </button>

          {/* Link ke Login */}
          <div className="text-center mt-4">
            <span className="text-gray-600">Sudah punya akun? </span>
            <button
              type="button"
              onClick={() => setPage("login")}
              className="text-blue-600 underline font-semibold hover:text-blue-800 transition"
            >
              Masuk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
