import { useEffect, useState } from "react";
import { api, apiFetch } from "../../utils/api";
import DashboardLayoutAdmin from "../../layout/DashboardLayoutAdmin";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningIcon from "@mui/icons-material/Warning";
import HistoryIcon from "@mui/icons-material/History";

// ─── Helper: warna chip status pegawai ───────────────────────────────────────
const getStatusColor = (status) => {
  if (status === "Hadir") return "success";
  if (status === "Terlambat") return "warning";
  if (status === "Alpha") return "error";
  if (status === "Izin") return "info";
  if (status === "Sakit") return "error";
  if (status === "Cuti") return "secondary";
  return "default";
};

// ─── Helper: format tanggal ke bahasa Indonesia ───────────────────────────────
const formatTanggal = (tgl) =>
  new Date(tgl).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// ═════════════════════════════════════════════════════════════════════════════
export default function DashboardAdmin() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch summary dashboard (total pegawai, hadir, terlambat, dll) ──────────
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

  // ── Proses alpha otomatis saat dashboard dibuka ───────────────────────────
  useEffect(() => {
    apiFetch("http://localhost:5000/api/absensi/proses-alpha", {
      method: "POST",
    })
      .then((r) => r?.json())
      .then((d) => {
        if (d?.inserted > 0) console.log("[Alpha]", d.message);
      })
      .catch(() => {}); // silent fail — tidak perlu tampil error ke user
  }, []);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayoutAdmin>
        <Box display="flex" justifyContent="center" alignItems="center" mt={10}>
          <CircularProgress />
        </Box>
      </DashboardLayoutAdmin>
    );
  }

  // ── Konfigurasi KPI cards ─────────────────────────────────────────────────
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

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayoutAdmin>
      {/* ── HEADER ── */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Dashboard Admin
        </Typography>
        <Typography color="text.secondary">
          Monitoring aktivitas absensi hari ini
        </Typography>
      </Paper>

      {/* ── KPI CARDS: Total Pegawai | Hadir | Terlambat ── */}
      <Grid container spacing={2} mb={3}>
        {kpiCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 4 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: card.bg,
                display: "flex",
                alignItems: "center",
                gap: 2,
                height: "100%",
              }}
            >
              {/* Icon bulat */}
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {card.icon}
              </Box>

              {/* Nilai & label */}
              <Box>
                <Typography
                  fontWeight="bold"
                  fontSize={32}
                  color={card.color}
                  lineHeight={1}
                >
                  {card.value ?? "-"}
                </Typography>
                <Typography
                  variant="body2"
                  color={card.color}
                  fontWeight={500}
                  mt={0.5}
                >
                  {card.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ── DAFTAR STATUS PEGAWAI HARI INI ── */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Typography fontWeight="bold" mb={2}>
          Pegawai
        </Typography>

        {summary?.pegawaiHariIni?.length === 0 ? (
          <Typography color="text.secondary">
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
                  <ListItemText primary={p.nama} />
                </ListItem>
                {/* Divider antar pegawai kecuali yang terakhir */}
                {i < summary.pegawaiHariIni.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Paper>

      {/* ── AKTIVITAS TERBARU (10 absensi terakhir hari ini) ── */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography fontWeight="bold" mb={2}>
          Aktivitas Terbaru
        </Typography>

        {summary?.aktivitas?.length === 0 ? (
          <Typography color="text.secondary">
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
              <HistoryIcon sx={{ color: "#1976d2", flexShrink: 0 }} />
              <Box>
                {/* Nama & status */}
                <Typography fontWeight="bold" fontSize={14}>
                  {item.nama} —{" "}
                  <Typography
                    component="span"
                    fontSize={14}
                    color={
                      item.status === "Terlambat"
                        ? "warning.main"
                        : "text.primary"
                    }
                  >
                    {item.status}
                  </Typography>
                </Typography>

                {/* Tanggal */}
                <Typography fontSize={13} color="text.secondary">
                  {formatTanggal(item.tanggal)}
                </Typography>

                {/* Jam masuk */}
                <Typography fontSize={12} color="text.secondary">
                  Jam masuk: {item.jam_masuk ?? "-"}
                </Typography>
              </Box>
            </Box>
          ))
        )}
      </Paper>
    </DashboardLayoutAdmin>
  );
}
