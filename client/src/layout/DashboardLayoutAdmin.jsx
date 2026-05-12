import { useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import SidebarAdmin from "../components/SidebarAdmin";
import Topbar from "../components/Topbar";

// Lebar sidebar — harus konsisten dengan SidebarAdmin & Topbar
const DRAWER_WIDTH = 240;

// ── DashboardLayoutAdmin ──────────────────────────────────────────────────────
// Layout utama halaman-halaman admin.
// Struktur: Sidebar (fixed kiri) + Topbar (fixed atas) + Content (scroll)
export default function DashboardLayoutAdmin({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // State drawer — hanya relevan di mobile (di desktop sidebar selalu tampil)
  const [open, setOpen] = useState(false);

  return (
    <Box
      sx={{ display: "flex", backgroundColor: "#f5f6fa", minHeight: "100vh" }}
    >
      {/* ── Sidebar (fixed, tidak ikut scroll) ──────────────────────────── */}
      <SidebarAdmin
        open={open}
        onClose={() => setOpen(false)}
        isMobile={isMobile}
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
