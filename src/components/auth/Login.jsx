import React, { useState } from "react";
import { auth, firestore } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function Login({ onSuccess }) {
  const [form, setForm] = useState({ identity: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Cari user by phone atau nama
    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("phone", "==", form.identity));
    const snap = await getDocs(q);

    let userDoc = null;
    if (!snap.empty) {
      userDoc = snap.docs[0].data();
    } else {
      // Coba cari by nama
      const q2 = query(usersRef, where("nama", "==", form.identity));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) userDoc = snap2.docs[0].data();
    }

    if (!userDoc) {
      setError("User tidak ditemukan.");
      setLoading(false);
      return;
    }

    // Gunakan email dummy
    const fakeEmail = `${userDoc.phone}@dummy.com`;
    try {
      await signInWithEmailAndPassword(auth, fakeEmail, form.password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError("Password salah.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-10 space-y-6 border border-gray-100"
      >
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-2 tracking-wide">
          Login
        </h2>
        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-center">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium mb-1">
            Nama atau Nomor Telepon
          </label>
          <input
            name="identity"
            placeholder="Nama atau Nomor Telepon"
            value={form.identity}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300 focus:outline-none transition"
            autoComplete="username"
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
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300 focus:outline-none transition"
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg shadow-md font-semibold hover:bg-blue-700 active:scale-95 transition text-lg"
        >
          {loading ? "Login..." : "Login"}
        </button>
      </form>
    </div>
  );
}
