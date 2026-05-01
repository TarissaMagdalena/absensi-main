import { useState } from "react";
import { Box } from "@mui/material";
import SidebarAdmin from "../components/SidebarAdmin";
import Topbar from "../components/Topbar";

export default function DashboardLayoutAdmin({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ display: "flex" }}>
      {/* SIDEBAR */}
      <SidebarAdmin open={open} />

      {/* MAIN */}
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
