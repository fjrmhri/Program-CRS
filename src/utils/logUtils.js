import { addDoc, collection } from "firebase/firestore";
import { firestore } from "../firebase";

export async function addLog({ namaUser, aksi, dataTerkait }) {
  // Mencatat aktivitas penting; tidak menghentikan alur utama bila gagal
  try {
    await addDoc(collection(firestore, "logs"), {
      namaUser,
      aksi,
      waktu: new Date().toISOString(),
      dataTerkait,
    });
  } catch (error) {
    console.error("Gagal menulis log aktivitas:", error);
  }
}
