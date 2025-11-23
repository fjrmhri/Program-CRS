import React, { useMemo, useState } from "react";
import { ref, set } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import { computeStats, parseExcel } from "../../utils/excelUtils";
import { addLog } from "../../utils/logUtils";
import { db } from "../../firebase";
import Spinner from "./Spinner";

export default function UploadModal({ user, initialData, onClose, onSuccess }) {
  const isEditing = Boolean(initialData);
  const defaultPreDate = useMemo(() => {
    if (!initialData?.preDate) return "";
    return new Date(initialData.preDate).toISOString().split("T")[0];
  }, [initialData]);
  const defaultPostDate = useMemo(() => {
    if (!initialData?.postDate) return "";
    return new Date(initialData.postDate).toISOString().split("T")[0];
  }, [initialData]);

  const [title, setTitle] = useState(initialData?.title || "");
  const [preDate, setPreDate] = useState(defaultPreDate);
  const [postDate, setPostDate] = useState(defaultPostDate);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title || !preDate || !postDate) return alert("Semua isian wajib!");

    if (!isEditing && !file) return alert("Silakan pilih file dataset.");

    if (file) {
      const ext = file.name.split(".").pop().toLowerCase();
      if (!["xlsx", "xls", "csv"].includes(ext))
        return alert("File harus .xlsx atau .csv");
    }

    setLoading(true);
    try {
      let raw = initialData?.raw || [];
      let analyses = initialData?.analyses || {};

      if (file) {
        raw = await parseExcel(file);
        analyses = computeStats(raw);
      } else if (!initialData) {
        throw new Error("File dataset wajib diisi.");
      }

      const datasetId = initialData?.id || uuidv4();
      const now = Date.now();
      const dataObj = {
        ...initialData,
        id: datasetId,
        title,
        preDate: new Date(preDate).getTime(),
        postDate: new Date(postDate).getTime(),
        raw,
        analyses,
        createdAt: initialData?.createdAt || now,
        updatedAt: now,
      };

      await set(ref(db, `datasets/${datasetId}`), dataObj);

      await addLog({
        namaUser: user?.nama || user?.name || "Admin",
        aksi: isEditing
          ? `Memperbarui data Pre-Post Test (${title})`
          : `Menambahkan data Pre-Post Test (${title})`,
        dataTerkait: { datasetId, title },
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Gagal memproses unggahan:", err);
      setError(`Gagal upload: ${err.message}`);
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
            {isEditing ? "Perbarui Data Pre-Post Test" : "Tambah Data Pre-Post Test"}
          </h2>
          <p className="text-gray-500 text-sm">
            {isEditing
              ? "Perbarui informasi dataset dan unggah file baru bila diperlukan."
              : "Silakan isi detail data dan upload file Excel untuk melanjutkan"}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

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
            Upload File Excel {isEditing && <span className="text-xs text-gray-500">(Opsional)</span>}
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
              id="fileUpload"
              required={!isEditing}
            />
            <label
              htmlFor="fileUpload"
              className="cursor-pointer text-gray-500 hover:text-blue-600 text-sm"
            >
              {file ? (
                <span className="font-medium text-blue-600">{file.name}</span>
              ) : (
                isEditing
                  ? "Klik untuk mengganti file (opsional)"
                  : "Klik untuk memilih file atau seret ke sini"
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
            {loading ? <Spinner /> : isEditing ? "Perbarui" : "Submit"}
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
