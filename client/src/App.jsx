import { Routes, Route } from "react-router-dom";

import Login from "./pages/login";

// admin
import DashboardAdmin from "./pages/Admin/DashboardAdmin";
import Approval from "./pages/admin/Approval";
import DataAbsensi from "./pages/admin/DataAbsensi";
import LaporanAbsensi from "./pages/admin/LaporanAbsensi";
import DataPegawai from "./pages/admin/DataPegawai";
import ManajemenAkun from "./pages/admin/ManajemenAkun";
import ProfilAdmin from "./pages/admin/Pengaturan";
import { PendingProvider } from "./pages/admin/PendingContext";

// pegawai
import Dashboard from "./pages/Pegawai/Dashboard";
import RiwayatAbsensi from "./pages/Pegawai/RiwayatAbsensi";
import PengaturanPegawai from "./pages/pegawai/PengaturanPegawai";

function App() {
  return (
    <PendingProvider>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* ADMIN */}
        <Route path="/admin/dashboard" element={<DashboardAdmin />} />
        <Route path="/admin/approval" element={<Approval />} />
        <Route path="/admin/absensi" element={<DataAbsensi />} />
        <Route path="/admin/laporan" element={<LaporanAbsensi />} />
        <Route path="/admin/datapegawai" element={<DataPegawai />} />
        <Route path="/admin/manajemenakun" element={<ManajemenAkun />} />
        <Route path="/admin/profil" element={<ProfilAdmin />} />

        {/* PEGAWAI */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/riwayat" element={<RiwayatAbsensi />} />
        <Route path="/pengaturan" element={<PengaturanPegawai />} />
      </Routes>
    </PendingProvider>
  );
}

export default App;
