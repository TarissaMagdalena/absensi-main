// ═══════════════════════════════════════════════════════════════
// DASHBOARD ADMIN — Halaman beranda admin
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { api, apiFetch } from "../../utils/api";
import DashboardLayoutAdmin from "../../layout/DashboardLayoutAdmin";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningIcon from "@mui/icons-material/Warning";
import HistoryIcon from "@mui/icons-material/History";

// ─── Helper: warna chip status pegawai ──────────────────────────────────────────────
const getStatusColor = (status) => {
  const map = {
    Hadir: "success",
    Terlambat: "warning",
    Alfa: "error",
    Izin: "info",
    Sakit: "error",
    Cuti: "secondary",
  };
  return map[status] || "default";
};
// ── Helper: format tanggal ke bahasa Indonesia ────────────────────────────────
const formatTanggal = (tgl) =>
  new Date(tgl).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// ═══════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function DashboardAdmin() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch summary dashboard: data ringkasan ────────────────────────
  useEffect(() => {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Jakarta",
    });
    api
      .get(`/absensi/dashboard-summary?tanggal=${today}`)
      .then((res) => setSummary(res.data))
      .catch((err) => console.error("Gagal fetch dashboard summary:", err))
      .finally(() => setLoading(false));
  }, []);

  // Proses Alfa otomatis ────────────────────────────────────────────────
  useEffect(() => {
    apiFetch("http://localhost:5000/api/absensi/proses-Alfa", {
      method: "POST",
    })
      .then((r) => r?.json())
      .then((d) => {
        if (d?.inserted > 0) console.log("[Alfa]", d.message);
      })
      .catch(() => {});
  }, []);
  // ── Loading state — tampilkan spinner ────────────────────────
  if (loading) {
    return (
      <DashboardLayoutAdmin>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="300px"
        >
          <CircularProgress />
        </Box>
      </DashboardLayoutAdmin>
    );
  }

  // ── Konfigurasi KPI Cards ─────────────────────────────────────
  const kpiCards = [
    {
      label: "Total Pegawai",
      value: summary?.totalPegawai,
      icon: <PeopleIcon sx={{ fontSize: 36, color: "#1976d2" }} />,
      bg: "#e3f2fd",
      color: "#1565c0",
    },
    {
      label: "Hadir Hari Ini",
      value: summary?.hadirHariIni,
      icon: <AccessTimeIcon sx={{ fontSize: 36, color: "#2e7d32" }} />,
      bg: "#e8f5e9",
      color: "#1b5e20",
    },
    {
      label: "Terlambat",
      value: summary?.terlambat,
      icon: <WarningIcon sx={{ fontSize: 36, color: "#e65100" }} />,
      bg: "#fff3e0",
      color: "#bf360c",
    },
  ];

  return (
    <DashboardLayoutAdmin>
      <Box sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
        {/* ── Header ────────────────────────────────────────────────────── */}
        <Paper sx={{ p: 3, borderRadius: 4, mb: 3 }}>
          <Typography
            sx={{
              fontSize: { xs: 22, sm: 28 },
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.5px",
            }}
          >
            Beranda Admin
          </Typography>
          <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>
            Pemantauan absensi hari ini
          </Typography>
        </Paper>

        {/* ── KPI Cards — selalu 3 kolom horizontal ─────────────────────── */}
        <Box
          display="grid"
          gridTemplateColumns="repeat(3, 1fr)"
          gap={{ xs: 1, sm: 2 }}
          mb={3}
        >
          {kpiCards.map((card) => (
            <Paper
              key={card.label}
              sx={{
                p: { xs: 1.5, sm: 2.5 },
                borderRadius: 3,
                backgroundColor: card.bg,
                display: "flex",
                alignItems: "center",
                gap: { xs: 1, sm: 2 },
              }}
            >
              {/* Icon — sembunyikan di mobile kecil agar tidak terlalu sesak */}
              <Box
                sx={{
                  width: { xs: 36, sm: 56 },
                  height: { xs: 36, sm: 56 },
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.7)",
                  display: { xs: "none", sm: "flex" },
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {card.icon}
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: 22, sm: 26 },
                    color: card.color,
                    lineHeight: 1,
                  }}
                >
                  {card.value ?? "-"}
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 11, sm: 14 },
                    color: card.color,
                    fontWeight: 500,
                    mt: 0.5,
                    lineHeight: 1.2,
                  }}
                >
                  {card.label}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* ── Daftar Pegawai Hari Ini ───────────────────────────────────────────── */}
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 2 }}>
            Pegawai
          </Typography>
          {summary?.pegawaiHariIni?.length === 0 ? (
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
              Belum ada data pegawai.
            </Typography>
          ) : (
            <List disablePadding>
              {summary?.pegawaiHariIni?.map((p, i) => (
                <Box key={i}>
                  <ListItem
                    disablePadding
                    sx={{ py: 1 }}
                    secondaryAction={
                      <Chip
                        label={p.status ?? "Belum Absen"}
                        color={getStatusColor(p.status)}
                        size="small"
                      />
                    }
                  >
                    <ListItemText
                      primary={p.nama}
                      primaryTypographyProps={{ fontSize: 14, fontWeight: 400 }}
                    />
                  </ListItem>
                  {i < summary.pegawaiHariIni.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </Paper>

        {/* ── Aktivitas Terbaru ──────────────────────────────────────────── */}
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 2 }}>
            Aktivitas Terbaru
          </Typography>
          {summary?.aktivitas?.length === 0 ? (
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
              Belum ada aktivitas hari ini.
            </Typography>
          ) : (
            summary?.aktivitas?.map((item, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: "#e3f2fd",
                  mb: 1,
                  "&:hover": { backgroundColor: "#dbeafe" },
                }}
              >
                {/* Ikon jam di kiri */}
                <HistoryIcon sx={{ color: "#1976d2", flexShrink: 0 }} />
                <Box minWidth={0}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                    {item.nama} —{" "}
                    <Typography
                      component="span"
                      sx={{
                        fontSize: 14,
                        color:
                          item.status === "Terlambat"
                            ? "warning.main"
                            : "text.primary",
                      }}
                    >
                      {item.status}
                    </Typography>
                  </Typography>
                  {/* Tanggal */}
                  <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                    {formatTanggal(item.tanggal)}
                  </Typography>
                  {/* Jam masuk */}
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    Jam masuk: {item.jam_masuk ?? "-"}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </Paper>
      </Box>
    </DashboardLayoutAdmin>
  );
}
