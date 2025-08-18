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
        className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-6 animate-fadeIn"
      >
        {/* HEADER */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-700">
            Tambah Data Pre-Post Test
          </h2>
          <p className="text-gray-500 text-sm">
            Silakan isi detail data dan upload file Excel untuk melanjutkan
          </p>
        </div>

        {/* INPUT TITLE */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Nama Data
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-gray-300 px-4 py-3 rounded-xl w-full focus:ring-2 focus:ring-blue-300 focus:outline-none transition shadow-sm"
            placeholder="Contoh: Hasil Pelatihan Kader Posyandu"
            required
          />
        </div>

        {/* INPUT DATES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Tanggal Pre Test
            </label>
            <input
              type="date"
              value={preDate}
              onChange={(e) => setPreDate(e.target.value)}
              className="border border-gray-300 px-4 py-3 rounded-xl w-full focus:ring-2 focus:ring-blue-300 focus:outline-none transition shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Tanggal Post Test
            </label>
            <input
              type="date"
              value={postDate}
              onChange={(e) => setPostDate(e.target.value)}
              className="border border-gray-300 px-4 py-3 rounded-xl w-full focus:ring-2 focus:ring-blue-300 focus:outline-none transition shadow-sm"
              required
            />
          </div>
        </div>

        {/* FILE UPLOAD */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Upload File Excel
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
              id="fileUpload"
              required
            />
            <label
              htmlFor="fileUpload"
              className="cursor-pointer text-gray-500 hover:text-blue-600 text-sm"
            >
              {file ? (
                <span className="font-medium text-blue-600">{file.name}</span>
              ) : (
                "Klik untuk memilih file atau seret ke sini"
              )}
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Hanya menerima file dengan format .xlsx, .xls, atau .csv
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col md:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow transition w-full md:w-auto"
          >
            {loading ? <Spinner /> : "Submit"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold shadow transition w-full md:w-auto"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
