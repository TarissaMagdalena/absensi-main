import { useEffect, useState } from "react";
import axios from "axios";
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

export default function DashboardAdmin() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  );

  // Real-time clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch data dari backend
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    axios
      .get(
        `http://localhost:5000/api/absensi/dashboard-summary?tanggal=${today}`,
      )
      .then((res) => setSummary(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status) => {
    if (status === "Hadir") return "success";
    if (status === "Terlambat") return "warning";
    if (status === "Alpha") return "error";
    return "default";
  };

  if (loading) {
    return (
      <DashboardLayoutAdmin>
        <Box display="flex" justifyContent="center" mt={10}>
          <CircularProgress />
        </Box>
      </DashboardLayoutAdmin>
    );
  }

  const kpiCards = [
    {
      label: "Total Pegawai",
      value: summary?.totalPegawai,
      icon: <PeopleIcon color="primary" />,
    },
    {
      label: "Hadir Hari Ini",
      value: summary?.hadirHariIni,
      icon: <AccessTimeIcon color="success" />,
    },
    {
      label: "Terlambat",
      value: summary?.terlambat,
      icon: <AccessTimeIcon color="warning" />,
    },
    {
      label: "Pengajuan Pending",
      value: summary?.pendingApproval,
      icon: <WarningIcon color="error" />,
    },
  ];

  return (
    <DashboardLayoutAdmin>
      {/* HEADER */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Dashboard Admin
            </Typography>
            <Typography color="text.secondary">
              Monitoring aktivitas absensi hari ini
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* KPI */}
      <Grid container spacing={2} mb={3}>
        {kpiCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, md: 3 }}>
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Box display="flex" alignItems="center" gap={2}>
                {card.icon}
                <Box>
                  <Typography fontWeight="bold" fontSize={22}>
                    {card.value ?? "-"}
                  </Typography>
                  <Typography variant="body2">{card.label}</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* PEGAWAI HARI INI */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Typography fontWeight="bold" mb={2}>
          Pegawai Hari Ini
        </Typography>
        <List>
          {summary?.pegawaiHariIni?.map((p, i) => (
            <Box key={i}>
              <ListItem
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
              <Divider />
            </Box>
          ))}
        </List>
      </Paper>

      {/* AKTIVITAS TERBARU */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography fontWeight="bold" mb={2}>
          Aktivitas Terbaru
        </Typography>
        {summary?.aktivitas?.length === 0 && (
          <Typography color="text.secondary">
            Belum ada aktivitas hari ini.
          </Typography>
        )}
        {summary?.aktivitas?.map((item, i) => (
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
            <HistoryIcon sx={{ color: "#1976d2" }} />
            <Box>
              <Typography fontWeight="bold" fontSize={14}>
                {item.nama} — {item.status}
              </Typography>
              <Typography fontSize={13}>
                {new Date(item.tanggal).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Typography>
              <Typography fontSize={12} color="text.secondary">
                {item.jam_masuk ?? "-"}
              </Typography>
            </Box>
          </Box>
        ))}
      </Paper>
    </DashboardLayoutAdmin>
  );
}
