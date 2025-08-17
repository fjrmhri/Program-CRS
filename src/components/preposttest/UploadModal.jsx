import React, { useState } from "react";
import { db } from "../../firebase";
import { ref, set } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import { parseExcel, computeStats } from "../../utils/excelUtils";
import Spinner from "./Spinner";

export default function UploadModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [preDate, setPreDate] = useState("");
  const [postDate, setPostDate] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !preDate || !postDate || !file)
      return alert("Semua isian wajib!");

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext))
      return alert("File harus .xlsx atau .csv");

    setLoading(true);
    try {
      const raw = await parseExcel(file);
      const analyses = computeStats(raw);
      const uid = uuidv4();

      const dataObj = {
        title,
        preDate: new Date(preDate).getTime(),
        postDate: new Date(postDate).getTime(),
        raw,
        analyses,
        createdAt: Date.now(),
      };

      await set(ref(db, `datasets/${uid}`), dataObj);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert(`Gagal upload: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-10 overflow-y-auto z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto space-y-6 animate-fadeIn"
      >
        <h2 className="text-2xl font-bold mb-2 text-blue-700 text-center">
          Tambah Data Pre-Post Test
        </h2>

        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Nama Data
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-300 focus:outline-none transition"
            required
          />
        </div>

        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <div className="flex-1">
            <label className="block mb-1 font-medium text-gray-700">
              Tanggal Pre Test
            </label>
            <input
              type="date"
              value={preDate}
              onChange={(e) => setPreDate(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-300 focus:outline-none transition"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1 font-medium text-gray-700">
              Tanggal Post Test
            </label>
            <input
              type="date"
              value={postDate}
              onChange={(e) => setPostDate(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-300 focus:outline-none transition"
              required
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Upload File Excel
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-300 focus:outline-none transition"
            required
          />
        </div>

        <div className="flex flex-col md:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition w-full md:w-auto"
          >
            {loading ? <Spinner /> : "Submit"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 hover:underline w-full md:w-auto"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
