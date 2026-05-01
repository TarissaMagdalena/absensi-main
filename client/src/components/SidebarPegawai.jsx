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
import { useNavigate, useLocation } from "react-router-dom";

export default function SidebarPegawai() {
  const navigate = useNavigate();
  const location = useLocation();

  const iconStyle = {
    fontSize: 26,
    color: "#555",
  };

  const menu = [
    {
      text: "Dashboard",
      icon: <DashboardIcon sx={iconStyle} />,
      path: "/dashboard",
    },
    {
      text: "Riwayat Absensi",
      icon: <HistoryIcon sx={iconStyle} />,
      path: "/riwayat",
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
        "& .MuiDrawer-paper": {
          width: 240,
          boxSizing: "border-box",
        },
      }}
    >
      {/* LOGO */}
      <Box sx={{ textAlign: "center", mt: 2, mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          E-Absen
        </Typography>
      </Box>

      <Divider />

      {/* ================= PROFILE ================= */}
      <List>
        <ListItemButton
          disableRipple
          sx={{
            mx: 1, // 🔥 samakan dengan menu
            mb: 1,
            gap: 2,
            cursor: "default",
            "&:hover": {
              backgroundColor: "transparent",
            },
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
            <Typography fontSize={14} fontWeight="bold">
              Tarissa Magdalena
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              NIK: 0987654321111
            </Typography>
          </Box>
        </ListItemButton>
      </List>

      <Divider />

      {/* ================= MENU ================= */}
      <List>
        {menu.map((item, index) => {
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
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      {/* ================= LOGOUT ================= */}
      <Box mt="auto">
        <List>
          <ListItemButton
            onClick={() => {
              if (window.confirm("Yakin ingin keluar?")) {
                navigate("/");
              }
            }}
            sx={{
              mx: 1,
              mb: 1,
              gap: 2,
              borderRadius: 2,

              color: "#d32f2f", // 🔥 merah

              "&:hover": {
                backgroundColor: "#fdecea", // hover merah soft
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0 }}>
              <LogoutIcon
                sx={{
                  ...iconStyle,
                  color: "#d32f2f", // 🔥 samakan dengan text
                }}
              />
            </ListItemIcon>

            <ListItemText
              primary="Keluar"
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: "bold",
              }}
            />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );
}
