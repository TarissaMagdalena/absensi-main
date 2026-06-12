import { useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import SidebarPegawai from "../components/SidebarPegawai";
import Topbar from "../components/Topbar";

const DRAWER_WIDTH = 240;

export default function DashboardLayoutPegawai({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(false);

  return (
    <Box
      sx={{
        px: { xs: 3, md: 3 },
        minHeight: "100vh",
        width: "100%",
        overflowX: "hidden",
        backgroundColor: "#f5f6fa",
      }}
    >
      <SidebarPegawai
        open={open}
        setOpen={setOpen}
        isMobile={isMobile}
        onClose={() => setOpen(false)}
      />

      <Box
        component="main"
        sx={{
          pt: 2,
          ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
          minHeight: "100vh",
          overflowX: "hidden",
          backgroundColor: "#f5f6fa",

          "& .MuiTableCell-root": {
            fontSize: "12px",
            fontWeight: 400,
          },
          "& .MuiButton-root": {
            fontSize: "12px",
            fontWeight: 500,
          },
          "& .MuiInputBase-root": {
            fontSize: "12px",
          },
          "& .MuiChip-root": {
            fontSize: "11px",
          },
        }}
      >
        <Topbar onMenuClick={() => setOpen((prev) => !prev)} />

        <Box
          sx={{
            px: { xs: 2, md: 3 },
            pt: 2,
            pb: 2,
            mt: "56px",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            overflowX: "hidden",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
