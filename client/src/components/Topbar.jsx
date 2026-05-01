import { useEffect, useState } from "react";
import { AppBar, Toolbar, Typography, IconButton, Box } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

const drawerWidth = 240;

export default function Topbar({ onMenuClick }) {
  const [time, setTime] = useState(null);

  useEffect(() => {
    const fetchTime = async () => {
      const res = await fetch("http://localhost:5000/api/time");
      const data = await res.json();
      setTime(new Date(data.serverTime));
    };

    fetchTime();
    const interval = setInterval(fetchTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  const formatDate = (date) =>
    date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatTime = (date) => date.toLocaleTimeString("id-ID");

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        backgroundColor: "#1c2b4a",
        zIndex: 1201, // 🔥 FIX UTAMA
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          onClick={onMenuClick}
          sx={{ display: { xs: "block", md: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />
        <Typography>
          {formatDate(time)} &nbsp; {formatTime(time)}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
