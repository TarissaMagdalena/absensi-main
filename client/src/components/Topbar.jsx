import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

const DRAWER_WIDTH = 240;

function formatTanggal(date) {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function formatWaktu(date) {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  });
}

export default function Topbar({ onMenuClick }) {
  const [time, setTime] = useState(null);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const res = await apiFetch("http://localhost:5000/api/time");
        if (!res || !res.ok) return;

        const data = await res.json();
        setTime(new Date(data.serverTime));
      } catch {
        // abaikan jika server belum siap
      }
    };

    fetchTime();
    const interval = setInterval(fetchTime, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { xs: "100%", md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
        backgroundColor: "#1c2b4a",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ minHeight: 56 }}>
        <IconButton
          color="inherit"
          onClick={onMenuClick}
          sx={{ display: { xs: "flex", md: "none" }, mr: 1 }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          sx={{ opacity: 0.92 }}
        >
          <Box display="flex" alignItems="center" gap={0.6}>
            <CalendarTodayIcon sx={{ fontSize: 14, opacity: 0.7 }} />
            <Typography
              variant="body2"
              sx={{ fontSize: 13, letterSpacing: 0.2 }}
            >
              {formatTanggal(time)}
            </Typography>
          </Box>

          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderColor: "rgba(255,255,255,0.25)", my: 0.8 }}
          />

          <Box display="flex" alignItems="center" gap={0.6}>
            <AccessTimeIcon sx={{ fontSize: 14, opacity: 0.7 }} />
            <Typography
              variant="body2"
              sx={{
                fontSize: 13,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: 0.5,
              }}
            >
              {formatWaktu(time)}
            </Typography>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
