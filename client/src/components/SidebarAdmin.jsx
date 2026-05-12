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
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

export default function SidebarAdmin() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Gaya icon menu ────────────────────────────────────────────────────────
  const iconStyle = { fontSize: 24, color: "#555" };

  // ── Daftar menu navigasi beserta icon dan path tujuan ─────────────────────
  const menu = [
    {
      text: "Dashboard",
      icon: <DashboardIcon sx={iconStyle} />,
      path: "/admin/dashboard",
    },
    {
      text: "Jadwal Shift",
      icon: <CalendarMonthIcon sx={iconStyle} />,
      path: "/admin/jadwal",
    },
    {
      text: "Data Absensi",
      icon: <AssignmentIcon sx={iconStyle} />,
      path: "/admin/absensi",
    },
    {
      text: "Laporan Absensi",
      icon: <AssessmentIcon sx={iconStyle} />,
      path: "/admin/laporan",
    },
    {
      text: "Data Pegawai",
      icon: <PeopleIcon sx={iconStyle} />,
      path: "/admin/datapegawai",
    },
    {
      text: "Manajemen Akun",
      icon: <PersonIcon sx={iconStyle} />,
      path: "/admin/manajemenakun",
    },
    {
      text: "Pengaturan",
      icon: <SettingsIcon sx={iconStyle} />,
      path: "/admin/profil",
    },
  ];

  // ── Hapus sesi user dan arahkan ke halaman login ──────────────────────────
  const handleLogout = () => {
    if (window.confirm("Yakin ingin keluar?")) {
      localStorage.removeItem("user");
      navigate("/");
    }
  };

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

      {/* ── Info profil admin (statis) ── */}
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
          <Typography fontSize={16} fontWeight="bold">
            Admin
          </Typography>
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
                display: "flex",
                justifyContent: "space-between",
                "&:hover": { backgroundColor: active ? "#e3f2fd" : "#f5f5f5" },
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <ListItemIcon sx={{ minWidth: 0 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: active ? "bold" : "normal",
                  }}
                />
              </Box>
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      {/* ── Tombol logout di bagian bawah sidebar ── */}
      <Box mt="auto">
        <List>
          <ListItemButton
            onClick={handleLogout}
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
