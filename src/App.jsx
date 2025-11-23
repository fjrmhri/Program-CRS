import React, { useEffect, useMemo, useState } from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Dashboard from "./components/preposttest/Dashboard";
import DetailModal from "./components/preposttest/DetailModal";
import UploadModal from "./components/preposttest/UploadModal";
import DashboardMSE from "./components/mse/DashboardMSE";
import DetailModalMSE from "./components/mse/DetailModalMSE";
import FormModalComparisonMSE from "./components/mse/FormModalComparisonMSE";
import FormModalMSE from "./components/mse/FormModalMSE";
import UploadModalMSE from "./components/mse/UploadModalMSE";
import Signup from "./components/auth/Signup";
import Login from "./components/auth/Login";
import SettingModal from "./components/SettingModal";
import DashboardSetting from "./components/setting/Dashboard";
import { auth, firestore } from "./firebase";

export default function App() {
  const [activeMenu, setActiveMenu] = useState("analytics");
  const [showUpload, setShowUpload] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editingDataset, setEditingDataset] = useState(null);
  const [showUploadMSE, setShowUploadMSE] = useState(false);
  const [showFormMSE, setShowFormMSE] = useState(false);
  const [selectedMSE, setSelectedMSE] = useState(null);
  const [showCompareMSE, setShowCompareMSE] = useState(false);
  const [compareDataMSE, setCompareDataMSE] = useState(null);
  const [authError, setAuthError] = useState("");

  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [showSetting, setShowSetting] = useState(false);
  const menuTabs = useMemo(
    () => [
      { key: "analytics", label: "Pre-Post Test", active: "bg-blue-600", inactive: "bg-white" },
      { key: "mse", label: "MSE Offline", active: "bg-green-600", inactive: "bg-white" },
      { key: "setting", label: "Setting", active: "bg-purple-600", inactive: "bg-white" },
    ],
    []
  );

  // Memantau status autentikasi dan memuat profil secara aman
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const phone = firebaseUser.email?.replace("@dummy.com", "");
          const userDoc = await getDoc(doc(firestore, "users", phone));

          if (userDoc.exists()) {
            setUser(userDoc.data());
            setPage("dashboard");
            setAuthError("");
          } else {
            setUser(null);
            setPage("login");
            setAuthError(
              "Data pengguna tidak ditemukan, silakan login ulang atau hubungi admin."
            );
          }
        } else {
          setUser(null);
          setPage("login");
        }
      } catch (error) {
        console.error("Gagal memuat data pengguna:", error);
        setAuthError("Terjadi kendala saat memuat profil. Coba beberapa saat lagi.");
        setUser(null);
        setPage("login");
      }
    });

    return () => unsubscribe();
  }, []);

  // Memuat ulang profil setelah login/daftar berhasil
  const handleAuthSuccess = async () => {
    try {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        const phone = firebaseUser.email?.replace("@dummy.com", "");
        const userDoc = await getDoc(doc(firestore, "users", phone));

        if (userDoc.exists()) {
          setUser(userDoc.data());
          setPage("dashboard");
          setAuthError("");
        } else {
          setAuthError("Profil pengguna tidak ditemukan.");
        }
      }
    } catch (error) {
      console.error("Kesalahan pasca login:", error);
      setAuthError("Tidak dapat memuat profil setelah login.");
    }
  };

  // Menangani proses logout agar tidak meninggalkan state menggantung
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setPage("login");
    } catch (error) {
      console.error("Gagal keluar:", error);
      setAuthError("Logout gagal, silakan coba lagi.");
    }
  };

  const renderAuthLayout = (component) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 py-10">
      <div className="w-full max-w-md">
        {authError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {authError}
          </div>
        )}
        {component}
      </div>
    </div>
  );

  // === AUTH PAGES ===
  if (page === "login") {
    return renderAuthLayout(
      <Login onSuccess={handleAuthSuccess} setPage={setPage} />
    );
  }

  if (page === "signup") {
    return renderAuthLayout(
      <Signup onSuccess={handleAuthSuccess} setPage={setPage} />
    );
  }

  const openUploadModal = (dataset = null) => {
    setEditingDataset(dataset);
    setShowUpload(true);
  };

  const closeUploadModal = () => {
    setEditingDataset(null);
    setShowUpload(false);
  };

  // === DASHBOARD ===
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50">
      {/* HEADER */}
      <header className="bg-white/90 border-b backdrop-blur sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 px-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-emerald-600 font-semibold">Estate Cerenti</p>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Admin CSR</h1>
            <p className="text-sm text-gray-500">Monitoring Pre-Post Test, MSE Offline, dan Pengaturan Akun</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs text-gray-500">Selamat datang</span>
              <span className="text-sm font-semibold text-gray-800">{user?.nama || "Admin"}</span>
            </div>
            <button
              onClick={() => setShowSetting(true)}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Cog6ToothIcon className="h-5 w-5 text-emerald-600" />
              Pengaturan Cepat
            </button>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <nav className="max-w-3xl mx-auto mt-6 px-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {menuTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveMenu(tab.key)}
            className={`py-3 rounded-2xl font-semibold shadow-sm transition-all border ${
              activeMenu === tab.key
                ? `${tab.active} text-white shadow-lg scale-[1.01]`
                : `${tab.inactive} text-gray-600 hover:bg-gray-100`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto mt-6 pb-12 px-4">
        <div className="bg-white/90 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 transition-all duration-300 border border-gray-100">
          {activeMenu === "analytics" && (
            <>
              <Dashboard
                user={user}
                onAdd={() => openUploadModal()}
                onView={setSelected}
                onEdit={(dataset) => openUploadModal(dataset)}
              />
              {showUpload && (
                <UploadModal user={user} initialData={editingDataset} onClose={closeUploadModal} />
              )}
              {selected && (
                <DetailModal data={selected} onClose={() => setSelected(null)} />
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
                onCompare={(data) => {
                  setCompareDataMSE(data);
                  setShowCompareMSE(true);
                }}
              />
              {showFormMSE && <FormModalMSE onClose={() => setShowFormMSE(false)} />}
              {showUploadMSE && <UploadModalMSE onClose={() => setShowUploadMSE(false)} />}
              {selectedMSE && <DetailModalMSE data={selectedMSE} onClose={() => setSelectedMSE(null)} />}
              {showCompareMSE && (
                <FormModalComparisonMSE data={compareDataMSE} onClose={() => setShowCompareMSE(false)} />
              )}
            </>
          )}
          {activeMenu === "setting" && <DashboardSetting user={user} onLogout={handleLogout} />}
        </div>
      </main>

      {showSetting && <SettingModal user={user} onLogout={handleLogout} onClose={() => setShowSetting(false)} />}
    </div>
  );
}
