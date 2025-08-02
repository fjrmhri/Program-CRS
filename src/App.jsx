import React, { useState } from "react";
import Dashboard from "./components/preposttest/Dashboard";
import UploadModal from "./components/preposttest/UploadModal";
import DetailModal from "./components/preposttest/DetailModal";
import DashboardMSE from "./components/mse/DashboardMSE";
import UploadModalMSE from "./components/mse/UploadModalMSE";
import DetailModalMSE from "./components/mse/DetailModalMSE";
import FormModalMSE from "./components/mse/FormModalMSE";
import FormModalComparisonMSE from "./components/mse/FormModalComparisonMSE";

export default function App() {
  const [activeMenu, setActiveMenu] = useState("analytics");
  const [showUpload, setShowUpload] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showUploadMSE, setShowUploadMSE] = useState(false);
  const [showFormMSE, setShowFormMSE] = useState(false);
  const [selectedMSE, setSelectedMSE] = useState(null);
  const [showCompareMSE, setShowCompareMSE] = useState(false);
  const [compareDataMSE, setCompareDataMSE] = useState(null);

  return (
    <div className="p-1 sm:p-2 md:p-4 bg-white shadow rounded">
      {}
      <header className="bg-white rounded-lg shadow-sm max-w-xl mx-auto mt-4 px-3 py-2 flex justify-around text-sm sm:text-base">
        <div className="text-center">
          <h1 className="text-xl sm:text-3xl font-bold tracking-wide">
            Program Corporate Social Responsibility
          </h1>
          <p className="text-sm sm:text-lg mt-1 text-white/90"></p>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <nav className="bg-white rounded-lg shadow-sm max-w-xl mx-auto mt-4 px-3 py-2 flex justify-around text-sm sm:text-base">
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
      <main className="max-w-full sm:max-w-3xl md:max-w-5xl mx-auto mt-2 px-1 pb-10">
        <div className="bg-white rounded-xl shadow p-2 sm:p-6 transition-all duration-300">
          {activeMenu === "analytics" && (
            <>
              <Dashboard
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
    </div>
  );
}
