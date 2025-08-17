import { collection, addDoc } from "firebase/firestore";
import { firestore } from "../firebase";

export async function addLog({ namaUser, aksi, dataTerkait }) {
  await addDoc(collection(firestore, "logs"), {
    namaUser,
    aksi,
    waktu: new Date().toISOString(),
    dataTerkait,
  });
}
