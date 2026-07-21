// ═══════════════════════════════════════════════════════════════
// SIDEBAR ADMIN — Navigasi kiri halaman admin
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { api } from "../utils/api";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import Badge from "@mui/material/Badge";

const DRAWER_WIDTH = 240;

export default function SidebarAdmin({ open, onClose, isMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dialogKeluar, setDialogKeluar] = useState(false);

  const iconStyle = { fontSize: 22, color: "#555" };

  // ── Fetch jumlah pengajuan cuti yang menunggu ─────────────────────────────
  const [jumlahMenunggu, setJumlahMenunggu] = useState(0);

  useEffect(() => {
    api
      .get("/pengajuan-cuti")
      .then((res) => {
        const menunggu = (res.data || []).filter(
          (d) => d.status === "Menunggu",
        ).length;
        setJumlahMenunggu(menunggu);
      })
      .catch(() => {});
  }, []);

  // Daftar Menu Navigasi Admin ────────────────────────────────
  const menu = [
    {
      text: "Beranda",
      icon: <DashboardIcon sx={iconStyle} />,
      path: "/admin/beranda",
    },
    {
      text: "Jadwal Kerja",
      icon: <CalendarMonthIcon sx={iconStyle} />,
      path: "/admin/jadwal",
    },
    {
      text: "Pengajuan Cuti",
      path: "/admin/pengajuan-cuti",
      icon: (
        <Badge badgeContent={jumlahMenunggu} color="error">
          <AssignmentTurnedInIcon />
        </Badge>
      ),
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

  // Navigasi ke halaman + tutup sidebar jika mobile ──────────
  const handleNav = (path) => {
    navigate(path);
    if (isMobile) onClose();
  };

  // Proses Logout ────────────────────────────────────────────
  const handleKonfirmasiKeluar = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const drawerPaperStyle = {
    width: DRAWER_WIDTH,
    maxWidth: DRAWER_WIDTH,
    boxSizing: "border-box",
    overflowX: "hidden",
    overflowY: "hidden",
  };

  // Konten sidebar ────────────────────────────────────────────
  const drawerContent = (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        maxWidth: DRAWER_WIDTH,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff",
        overflowX: "hidden",
        overflowY: "hidden",
      }}
    >
      {/* ── Logo / Nama Aplikasi ── */}
      <Box sx={{ textAlign: "center", mt: 2, mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          E-Absen
        </Typography>
      </Box>
      <Divider />

      {/* ── Profil Admin ── */}
      <List sx={{ overflowX: "hidden", py: 0.8 }}>
        <ListItemButton
          disableRipple
          sx={{
            mx: 1,
            my: 0,
            py: 0.8,
            px: 2,
            minHeight: 44,
            gap: 2,
            maxWidth: "calc(100% - 16px)",
            cursor: "default",
            "&:hover": { backgroundColor: "transparent" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 0 }}>
            <PersonIcon sx={iconStyle} />
          </ListItemIcon>

          <Typography fontSize={15} fontWeight="bold" noWrap>
            Admin
          </Typography>
        </ListItemButton>
      </List>
      <Divider />

      {/* ── Daftar Menu Navigasi ── */}
      <List sx={{ flexGrow: 1, overflowX: "hidden" }}>
        {menu.map((item, index) => {
          const active = location.pathname === item.path;

          return (
            <ListItemButton
              key={index}
              onClick={() => handleNav(item.path)}
              sx={{
                backgroundColor: active ? "#e3f2fd" : "transparent",
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                gap: 2,
                maxWidth: "calc(100% - 16px)",
                overflowX: "hidden",
                "&:hover": {
                  backgroundColor: active ? "#e3f2fd" : "#f5f5f5",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 0 }}>{item.icon}</ListItemIcon>

              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: active ? "bold" : "normal",
                  noWrap: true,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />

      {/* ── Tombol Keluar ── */}
      <List sx={{ overflowX: "hidden" }}>
        <ListItemButton
          onClick={() => setDialogKeluar(true)}
          sx={{
            mx: 1,
            mb: 1,
            gap: 2,
            borderRadius: 2,
            maxWidth: "calc(100% - 16px)",
            color: "#d32f2f",
            "&:hover": { backgroundColor: "#fdecea" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 0 }}>
            <LogoutIcon sx={{ ...iconStyle, color: "#d32f2f" }} />
          </ListItemIcon>

          <ListItemText
            primary="Keluar"
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: "bold",
              noWrap: true,
            }}
          />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <>
      {isMobile ? (
        // MOBILE: Drawer overlay — muncul di atas konten saat hamburger diklik
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": drawerPaperStyle,
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        // DESKTOP: Drawer permanen — selalu terlihat di kiri
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            overflowX: "hidden",
            "& .MuiDrawer-paper": drawerPaperStyle,
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* ── Dialog Konfirmasi Keluar ── */}
      <Dialog
        open={dialogKeluar}
        onClose={() => setDialogKeluar(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight="bold">Konfirmasi Keluar</DialogTitle>

        <DialogContent>
          <Typography fontSize={14} color="text.secondary">
            Apakah kamu yakin ingin keluar dari aplikasi?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setDialogKeluar(false)}
            fullWidth
          >
            Batal
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleKonfirmasiKeluar}
            fullWidth
          >
            Keluar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
