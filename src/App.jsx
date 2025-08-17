import React, { useState, useEffect } from "react";
import { auth, firestore } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import Dashboard from "./components/preposttest/Dashboard";
import UploadModal from "./components/preposttest/UploadModal";
import DetailModal from "./components/preposttest/DetailModal";
import DashboardMSE from "./components/mse/DashboardMSE";
import UploadModalMSE from "./components/mse/UploadModalMSE";
import DetailModalMSE from "./components/mse/DetailModalMSE";
import FormModalMSE from "./components/mse/FormModalMSE";
import FormModalComparisonMSE from "./components/mse/FormModalComparisonMSE";
import Signup from "./components/auth/Signup";
import Login from "./components/auth/Login";
import SettingModal from "./components/SettingModal"; // Tambahkan ini
import { Cog6ToothIcon } from "@heroicons/react/24/outline"; // Heroicons untuk ikon setting

export default function App() {
  const [activeMenu, setActiveMenu] = useState("analytics");
  const [showUpload, setShowUpload] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showUploadMSE, setShowUploadMSE] = useState(false);
  const [showFormMSE, setShowFormMSE] = useState(false);
  const [selectedMSE, setSelectedMSE] = useState(null);
  const [showCompareMSE, setShowCompareMSE] = useState(false);
  const [compareDataMSE, setCompareDataMSE] = useState(null);

  // Auth state
  const [page, setPage] = useState("login"); // "login" | "signup" | "dashboard"
  const [user, setUser] = useState(null);
  const [showSetting, setShowSetting] = useState(false);

  // Cek status login saat pertama kali load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Ambil user dari Firestore berdasarkan nomor telepon (dari email dummy)
        const phone = firebaseUser.email?.replace("@dummy.com", "");
        const userDoc = await getDoc(doc(firestore, "users", phone));
        if (userDoc.exists()) {
          setUser(userDoc.data());
          setPage("dashboard");
        } else {
          setUser(null);
          setPage("login");
        }
      } else {
        setUser(null);
        setPage("login");
      }
    });
    return () => unsubscribe();
  }, []);

  // Setelah login/signup sukses
  const handleAuthSuccess = async () => {
    // Ambil user dari Firebase Auth
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      const phone = firebaseUser.email?.replace("@dummy.com", "");
      const userDoc = await getDoc(doc(firestore, "users", phone));
      if (userDoc.exists()) {
        setUser(userDoc.data());
        setPage("dashboard");
      }
    }
  };

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setPage("login");
  };

  // Render auth pages
  if (page === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="w-full max-w-md">
          <Login onSuccess={handleAuthSuccess} />
          <div className="text-center mt-4">
            <span>Belum punya akun? </span>
            <button
              className="text-blue-600 underline font-semibold hover:text-blue-800 transition"
              onClick={() => setPage("signup")}
            >
              Daftar
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (page === "signup") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="w-full max-w-md">
          <Signup onSuccess={handleAuthSuccess} />
          <div className="text-center mt-4">
            <span>Sudah punya akun? </span>
            <button
              className="text-blue-600 underline font-semibold hover:text-blue-800 transition"
              onClick={() => setPage("login")}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard (setelah login)
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-30">
        <div className="max-w-screen-lg mx-auto flex flex-col items-center py-4 px-4">
          <span className="text-xl sm:text-2xl font-bold text-black tracking-wide text-center">
            Program Corporate Social Responsibility
          </span>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setShowSetting(true)}
              className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition flex items-center"
              title="Setting"
            >
              <Cog6ToothIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <nav className="bg-white rounded-lg shadow-sm max-w-xl mx-auto mt-6 px-3 py-2 flex justify-around text-sm sm:text-base">
        <button
          onClick={() => setActiveMenu("analytics")}
          className={`w-1/2 text-center py-2 rounded-md transition-all ${
            activeMenu === "analytics"
              ? "bg-blue-100 text-blue-600 font-semibold shadow"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Pre‑Post Test
        </button>
        <button
          onClick={() => setActiveMenu("mse")}
          className={`w-1/2 text-center py-2 rounded-md transition-all ${
            activeMenu === "mse"
              ? "bg-green-100 text-green-600 font-semibold shadow"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          MSE Offline
        </button>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-full sm:max-w-3xl md:max-w-5xl mx-auto mt-4 px-2 pb-10">
        <div className="bg-white rounded-xl shadow-lg p-2 sm:p-6 transition-all duration-300">
          {activeMenu === "analytics" && (
            <>
              <Dashboard
                user={user}
                onAdd={() => setShowUpload(true)}
                onView={setSelected}
                onEdit={() => {}} // tambahkan jika perlu
              />
              {showUpload && (
                <UploadModal onClose={() => setShowUpload(false)} />
              )}
              {selected && (
                <DetailModal
                  data={selected}
                  onClose={() => setSelected(null)}
                />
              )}
            </>
          )}

          {activeMenu === "mse" && (
            <>
              <DashboardMSE
                user={user}
                onAddForm={() => setShowFormMSE(true)}
                onAddUpload={() => setShowUploadMSE(true)}
                onView={setSelectedMSE}
                onCompare={(d) => {
                  setCompareDataMSE(d);
                  setShowCompareMSE(true);
                }}
              />
              {showFormMSE && (
                <FormModalMSE onClose={() => setShowFormMSE(false)} />
              )}
              {showUploadMSE && (
                <UploadModalMSE onClose={() => setShowUploadMSE(false)} />
              )}
              {selectedMSE && (
                <DetailModalMSE
                  data={selectedMSE}
                  onClose={() => setSelectedMSE(null)}
                />
              )}
              {showCompareMSE && (
                <FormModalComparisonMSE
                  data={compareDataMSE}
                  onClose={() => setShowCompareMSE(false)}
                />
              )}
            </>
          )}
        </div>
      </main>

      {showSetting && (
        <SettingModal
          user={user}
          onLogout={handleLogout}
          onClose={() => setShowSetting(false)}
        />
      )}
    </div>
  );
}
