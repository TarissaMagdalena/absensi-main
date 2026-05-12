import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";

export default function SidebarPegawai() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Ambil data user dari localStorage (di-memo agar tidak re-parse tiap render) ──
  const user = useMemo(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  }, []);

  // ── Gaya icon menu ────────────────────────────────────────────────────────
  const iconStyle = { fontSize: 26, color: "#555" };

  // ── Daftar menu navigasi beserta icon dan path tujuan ─────────────────────
  const menu = [
    {
      text: "Dashboard",
      icon: <DashboardIcon sx={iconStyle} />,
      path: "/dashboard",
    },
    {
      text: "Rekap Kehadiran",
      icon: <HistoryIcon sx={iconStyle} />,
      path: "/rekapkehadiran",
    },
    {
      text: "Pengaturan",
      icon: <SettingsIcon sx={iconStyle} />,
      path: "/pengaturan",
    },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": { width: 240, boxSizing: "border-box" },
      }}
    >
      {/* ── Logo aplikasi ── */}
      <Box sx={{ textAlign: "center", mt: 2, mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          E-Absen
        </Typography>
      </Box>

      <Divider />

      {/* ── Info profil pegawai (dinamis dari localStorage) ── */}
      <List>
        <ListItemButton
          disableRipple
          sx={{
            mx: 1,
            mb: 1,
            gap: 2,
            cursor: "default",
            "&:hover": { backgroundColor: "transparent" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 0 }}>
            <PersonIcon
              sx={{
                fontSize: 26,
                color: "#555",
                backgroundColor: "#e5e7eb",
                borderRadius: "50%",
                p: 0.7,
              }}
            />
          </ListItemIcon>
          <Box>
            {/* Nama & NIK pegawai diambil dari localStorage */}
            <Typography fontSize={14} fontWeight="bold">
              {user?.nama || "Pegawai"}
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              NIK: {user?.nik || "-"}
            </Typography>
          </Box>
        </ListItemButton>
      </List>

      <Divider />

      {/* ── Daftar menu navigasi ── */}
      <List>
        {menu.map((item, index) => {
          // Cek apakah menu ini sedang aktif berdasarkan pathname
          const active = location.pathname === item.path;
          return (
            <ListItemButton
              key={index}
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor: active ? "#e3f2fd" : "transparent",
                borderRadius: 2,
                mx: 1,
                mb: 1,
                gap: 2,
                "&:hover": { backgroundColor: active ? "#e3f2fd" : "#f5f5f5" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 0 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: active ? "bold" : "normal",
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      {/* ── Tombol logout di bagian bawah sidebar ── */}
      <Box mt="auto">
        <List>
          <ListItemButton
            onClick={() => {
              // Hapus sesi user dan arahkan ke halaman login
              if (window.confirm("Yakin ingin keluar?")) {
                localStorage.removeItem("user");
                navigate("/");
              }
            }}
            sx={{
              mx: 1,
              mb: 1,
              gap: 2,
              borderRadius: 2,
              color: "#d32f2f",
              "&:hover": { backgroundColor: "#fdecea" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0 }}>
              <LogoutIcon sx={{ ...iconStyle, color: "#d32f2f" }} />
            </ListItemIcon>
            <ListItemText
              primary="Keluar"
              primaryTypographyProps={{ fontSize: 14, fontWeight: "bold" }}
            />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );
}
