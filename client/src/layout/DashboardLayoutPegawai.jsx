import { useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import SidebarPegawai from "../components/SidebarPegawai";
import Topbar from "../components/Topbar";

// Lebar sidebar — harus konsisten dengan SidebarPegawai & Topbar
const DRAWER_WIDTH = 240;

// ── DashboardLayoutPegawai ────────────────────────────────────────────────────
// Layout utama halaman-halaman pegawai.
// Struktur: Sidebar (fixed kiri) + Topbar (fixed atas) + Content (scroll)
export default function DashboardLayoutPegawai({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Di desktop sidebar terbuka by default, di mobile tertutup
  const [open, setOpen] = useState(true);

  return (
    <Box
      sx={{ display: "flex", backgroundColor: "#f5f6fa", minHeight: "100vh" }}
    >
      {/* ── Sidebar (fixed, tidak ikut scroll) ──────────────────────────── */}
      <SidebarPegawai
        open={open}
        setOpen={setOpen}
        isMobile={isMobile}
        onClose={() => setOpen(false)}
      />

      {/* ── Area konten kanan ────────────────────────────────────────────── */}
      {/* flexGrow:1 agar mengisi sisa lebar setelah sidebar */}
      <Box sx={{ flexGrow: 1 }}>
        {/* ── Topbar (fixed atas) ───────────────────────────────────────── */}
        <Topbar onMenuClick={() => setOpen((prev) => !prev)} />

        {/* ── Konten halaman ────────────────────────────────────────────── */}
        {/* mt:"64px" untuk offset tinggi Topbar agar konten tidak tertutup */}
        <Box sx={{ px: 3, py: 3, mt: "64px", minHeight: "100vh" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
