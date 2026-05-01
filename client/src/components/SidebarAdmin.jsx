import { useNavigate, useLocation } from "react-router-dom";
import { usePending } from "../pages/admin/PendingContext";

import {
  Drawer,
  Badge,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";

export default function SidebarAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingCount } = usePending(); // ← ambil dari context

  const iconStyle = {
    fontSize: 24,
    color: "#555",
  };

  const menu = [
    {
      text: "Dashboard",
      icon: <DashboardIcon sx={iconStyle} />,
      path: "/admin/dashboard",
    },
    {
      text: "Approval",
      icon: <PendingActionsIcon sx={iconStyle} />,
      path: "/admin/approval",
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

      {/* PROFILE */}
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

      {/* MENU */}
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
                display: "flex",
                justifyContent: "space-between",
                "&:hover": {
                  backgroundColor: active ? "#e3f2fd" : "#f5f5f5",
                },
              }}
            >
              {/* LEFT (ICON + TEXT) */}
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

              {/* RIGHT (BADGE - hanya approval) */}
              {item.text === "Approval" && pendingCount > 0 && (
                <Badge
                  badgeContent={pendingCount > 9 ? "9+" : pendingCount}
                  color="error"
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      {/* LOGOUT */}
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
              color: "#d32f2f",
              "&:hover": {
                backgroundColor: "#fdecea",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0 }}>
              <LogoutIcon
                sx={{
                  ...iconStyle,
                  color: "#d32f2f",
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
