import { useState } from "react";
import { Box, useMediaQuery } from "@mui/material";
import SidebarPegawai from "../components/SidebarPegawai";
import Topbar from "../components/Topbar";

export default function DashboardLayoutPegawai({ children }) {
  const [open, setOpen] = useState(true);
  const isMobile = useMediaQuery("(max-width:768px)");

  return (
    <Box sx={{ display: "flex" }}>
      {/* SIDEBAR */}
      <SidebarPegawai open={open} setOpen={setOpen} isMobile={isMobile} />

      {/* CONTENT */}
      <Box sx={{ flexGrow: 1 }}>
        {/* TOPBAR */}
        <Topbar onMenuClick={() => setOpen(!open)} />

        {/* CONTENT */}
        <Box
          sx={{
            px: 3,
            py: 3,
            mt: "64px",
            minHeight: "100vh",
            maxWidth: "1200px",
            mx: "auto", // center konten
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
