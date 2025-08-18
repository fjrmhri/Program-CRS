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
import SettingModal from "./components/SettingModal";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import DashboardSetting from "./components/setting/Dashboard";

export default function App() {
  const [activeMenu, setActiveMenu] = useState("analytics");
  const [showUpload, setShowUpload] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showUploadMSE, setShowUploadMSE] = useState(false);
  const [showFormMSE, setShowFormMSE] = useState(false);
  const [selectedMSE, setSelectedMSE] = useState(null);
  const [showCompareMSE, setShowCompareMSE] = useState(false);
  const [compareDataMSE, setCompareDataMSE] = useState(null);

  const [page, setPage] = useState("login"); // login | signup | dashboard
  const [user, setUser] = useState(null);
  const [showSetting, setShowSetting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
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

  const handleAuthSuccess = async () => {
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

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setPage("login");
  };

  // === AUTH PAGES ===
  if (page === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="w-full max-w-md">
          <Login onSuccess={handleAuthSuccess} setPage={setPage} />
        </div>
      </div>
    );
  }

  if (page === "signup") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="w-full max-w-md">
          <Signup onSuccess={handleAuthSuccess} setPage={setPage} />
        </div>
      </div>
    );
  }

  // === DASHBOARD ===
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-screen-lg mx-auto flex flex-col items-center py-4 px-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center">
            Dashboard Admin
          </h1>
          <p className="text-sm sm:text-base text-gray-500 text-center">
            Program Corporate Social Responsibility — Estate Cerenti
          </p>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <nav className="max-w-lg mx-auto mt-6 px-3 grid grid-cols-3 gap-3">
        <button
          onClick={() => setActiveMenu("analytics")}
          className={`py-3 rounded-xl font-semibold shadow-sm transition-all ${
            activeMenu === "analytics"
              ? "bg-blue-600 text-white shadow-lg scale-[1.02]"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          Pre-Post Test
        </button>
        <button
          onClick={() => setActiveMenu("mse")}
          className={`py-3 rounded-xl font-semibold shadow-sm transition-all ${
            activeMenu === "mse"
              ? "bg-green-600 text-white shadow-lg scale-[1.02]"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          MSE Offline
        </button>
        <button
          onClick={() => setActiveMenu("setting")}
          className={`py-3 rounded-xl font-semibold shadow-sm transition-all ${
            activeMenu === "setting"
              ? "bg-purple-600 text-white shadow-lg scale-[1.02]"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          Setting
        </button>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-full sm:max-w-3xl md:max-w-5xl mx-auto mt-6  pb-12">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 transition-all duration-300">
          {activeMenu === "analytics" && (
            <>
              <Dashboard
                user={user}
                onAdd={() => setShowUpload(true)}
                onView={setSelected}
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
          {activeMenu === "setting" && (
            <DashboardSetting user={user} onLogout={handleLogout} />
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
