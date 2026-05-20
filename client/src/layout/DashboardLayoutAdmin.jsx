import { useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import SidebarAdmin from "../components/SidebarAdmin";
import Topbar from "../components/Topbar";

const DRAWER_WIDTH = 240;

export default function DashboardLayoutAdmin({ children }) {
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
      <SidebarAdmin
        open={open}
        onClose={() => setOpen(false)}
        isMobile={isMobile}
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
            fontSize: "13px",
            fontWeight: 400,
          },
          "& .MuiButton-root": {
            fontSize: "13px",
            fontWeight: 500,
          },
          "& .MuiInputBase-root": {
            fontSize: "14px",
          },
          "& .MuiChip-root": {
            fontSize: "12px",
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
