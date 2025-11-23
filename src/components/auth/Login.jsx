import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import logo from "../../assets/logo.PNG";
import { auth } from "../../firebase";

export default function Login({ onSuccess, setPage }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Menangani proses login dengan umpan balik error yang jelas
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fakeEmail = `${phone}@dummy.com`;

    try {
      await signInWithEmailAndPassword(auth, fakeEmail, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Gagal login:", err);
      setError("Nomor telepon atau password salah atau jaringan bermasalah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo" className="h-20 mb-3" />
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            Selamat Datang
          </h2>
          <p className="text-gray-600 text-base">
            Silakan masuk untuk melanjutkan
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
              Nomor Telepon
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-400 focus:outline-none transition"
              placeholder="Masukkan nomor telepon"
              autoComplete="tel"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-400 focus:outline-none transition"
              placeholder="Masukkan password"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {/* Tombol Login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>

          {/* Link ke Signup */}
          <div className="text-center mt-4">
            <span className="text-gray-600">Belum punya akun? </span>
            <button
              type="button"
              onClick={() => setPage("signup")}
              className="text-blue-600 underline font-semibold hover:text-blue-800 transition"
            >
              Daftar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
