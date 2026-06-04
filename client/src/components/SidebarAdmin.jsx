import { useState } from "react";
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

import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

const DRAWER_WIDTH = 240;

export default function SidebarAdmin({ open, onClose, isMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dialogKeluar, setDialogKeluar] = useState(false);

  const iconStyle = { fontSize: 22, color: "#555" };

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

  const handleNav = (path) => {
    navigate(path);
    if (isMobile) onClose();
  };

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
      <Box sx={{ textAlign: "center", mt: 2, mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          E-Absen
        </Typography>
      </Box>

      <Divider />

      <List sx={{ overflowX: "hidden" }}>
        <ListItemButton
          disableRipple
          sx={{
            mx: 1,
            mb: 1,
            gap: 2,
            maxWidth: "calc(100% - 16px)",
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

          <Typography fontSize={15} fontWeight="bold" noWrap>
            Admin
          </Typography>
        </ListItemButton>
      </List>

      <Divider />

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
