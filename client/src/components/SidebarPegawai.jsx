import { useMemo, useState } from "react";
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
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";

const DRAWER_WIDTH = 240;

export default function SidebarPegawai({ open, isMobile, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dialogLogout, setDialogLogout] = useState(false);

  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const iconStyle = { fontSize: 24, color: "#555" };

  const menu = [
    {
      text: "Beranda",
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

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile && onClose) onClose();
  };

  const handleLogout = () => setDialogLogout(true);

  const handleKonfirmasiLogout = () => {
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

          <Box sx={{ minWidth: 0, overflow: "hidden" }}>
            <Typography fontSize={14} fontWeight="bold" noWrap>
              {user?.nama || "Pegawai"}
            </Typography>
            <Typography fontSize={12} color="text.secondary" noWrap>
              NIK: {user?.nik || "-"}
            </Typography>
          </Box>
        </ListItemButton>
      </List>

      <Divider />

      <List sx={{ flexGrow: 1, overflowX: "hidden" }}>
        {menu.map((item, index) => {
          const active = location.pathname === item.path;

          return (
            <ListItemButton
              key={index}
              onClick={() => handleNavigate(item.path)}
              sx={{
                backgroundColor: active ? "#e3f2fd" : "transparent",
                borderRadius: 2,
                mx: 1,
                mb: 1,
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
          onClick={handleLogout}
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
        open={dialogLogout}
        onClose={() => setDialogLogout(false)}
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
            onClick={() => setDialogLogout(false)}
            fullWidth
          >
            Batal
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleKonfirmasiLogout}
            fullWidth
          >
            Keluar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
