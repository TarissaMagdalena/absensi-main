import { useState, useEffect } from "react";
import { apiFetch } from "../../utils/api";
import DashboardLayoutPegawai from "../../layout/DashboardLayoutPegawai";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Snackbar,
  Alert,
  Grid,
} from "@mui/material";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: warna chip status
// ─────────────────────────────────────────────────────────────────────────────
function getStatusColor(status) {
  const map = {
    Hadir: "success",
    Terlambat: "warning",
    Izin: "info",
    Sakit: "error",
    Cuti: "secondary",
    Alpha: "default",
  };
  return map[status] || "default";
}

// Helper: status yang tidak memerlukan tampilan jam/area
const STATUS_NON_HADIR = ["Izin", "Sakit", "Cuti", "Alpha"];
const isNonHadir = (status) => STATUS_NON_HADIR.includes(status);

// Helper: format tanggal ke bahasa Indonesia
const formatTanggal = (tgl) =>
  new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// ─────────────────────────────────────────────────────────────────────────────
export default function RekapKehadiran() {
  // ── Ambil data user dari localStorage ──────────────────────────────────────
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  // ── State data & filter ────────────────────────────────────────────────────
  const [data, setData] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ── State jatah cuti ───────────────────────────────────────────────────────
  const [jatahCuti, setJatahCuti] = useState({
    jatah: 12,
    terpakai: 0,
    sisa: 12,
  });

  // ── State notifikasi ───────────────────────────────────────────────────────
  const [notif, setNotif] = useState({
    open: false,
    message: "",
    severity: "warning",
  });
  const showNotif = (message, severity = "warning") =>
    setNotif({ open: true, message, severity });

  // ── Fetch rekap kehadiran ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.pegawai_id) return;

    const fetchRiwayat = async () => {
      try {
        const res = await apiFetch(
          `http://localhost:5000/api/absensi/rekapan/${user.pegawai_id}`,
        );
        if (!res) return; // 401 → sudah di-handle apiFetch (redirect ke login)
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error("Gagal ambil rekapan:", err);
      }
    };

    fetchRiwayat();
  }, [user?.pegawai_id]);

  // ── Fetch jatah cuti ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.pegawai_id) return;

    const fetchJatahCuti = async () => {
      try {
        const tahun = new Date().getFullYear();
        const res = await apiFetch(
          `http://localhost:5000/api/cuti/pegawai/${user.pegawai_id}?tahun=${tahun}`,
        );
        if (!res) return;
        const json = await res.json();
        setJatahCuti(json);
      } catch (err) {
        console.error("Gagal ambil jatah cuti:", err);
      }
    };

    fetchJatahCuti();
  }, [user?.pegawai_id]);

  // ── Filter data ────────────────────────────────────────────────────────────
  const filteredData = data.filter((item) => {
    const tgl = item.tanggal?.slice(0, 10);
    return (
      (filterStatus ? item.status === filterStatus : true) &&
      (startDate ? tgl >= startDate : true) &&
      (endDate ? tgl <= endDate : true)
    );
  });

  // ── Hitung ringkasan ───────────────────────────────────────────────────────
  const totalTepat = filteredData.filter((d) => d.status === "Hadir").length;
  const totalTerlambat = filteredData.filter(
    (d) => d.status === "Terlambat",
  ).length;
  const totalTidakMasuk = filteredData.filter((d) =>
    ["Izin", "Sakit", "Cuti", "Alpha"].includes(d.status),
  ).length;

  // ── Download PDF laporan ───────────────────────────────────────────────────
  const handleDownload = () => {
    if (!startDate || !endDate) {
      showNotif("Pilih periode terlebih dahulu sebelum download!");
      return;
    }
    window.open(
      `http://localhost:5000/api/laporan/download?pegawai_id=${user.pegawai_id}&start=${startDate}&end=${endDate}`,
      "_blank",
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayoutPegawai>
      <Box>
        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Rekap Kehadiran
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rekap kehadiran kamu
            </Typography>
          </Box>
        </Box>

        {/* ── KARTU RINGKASAN ───────────────────────────────────────────────── */}
        <Box display="flex" gap={2} flexWrap="wrap" mb={3}>
          {[
            {
              label: "Tepat Waktu",
              value: totalTepat,
              color: "success.main",
              bg: "#e8f5e9",
            },
            {
              label: "Terlambat",
              value: totalTerlambat,
              color: "warning.main",
              bg: "#fff8e1",
            },
            {
              label: "Tidak Masuk",
              value: totalTidakMasuk,
              color: "info.main",
              bg: "#e3f2fd",
            },
            {
              label: "Sisa Cuti",
              value: `${jatahCuti.sisa}/${jatahCuti.jatah}`,
              color: jatahCuti.sisa <= 3 ? "error.main" : "success.main",
              bg: jatahCuti.sisa <= 3 ? "#ffebee" : "#e8f5e9",
            },
          ].map((s) => (
            <Paper
              key={s.label}
              sx={{
                p: 2,
                borderRadius: 3,
                minWidth: 150,
                backgroundColor: s.bg,
                flex: 1,
              }}
            >
              <Typography variant="body2" fontWeight="bold" color={s.color}>
                {s.label}
              </Typography>
              <Typography
                variant="h5"
                fontWeight="bold"
                color={s.color}
                my={0.5}
              >
                {s.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* ── FILTER & DOWNLOAD ─────────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Filter status */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">Semua Status</MenuItem>
                <MenuItem value="Hadir">Hadir</MenuItem>
                <MenuItem value="Terlambat">Terlambat</MenuItem>
                <MenuItem value="Izin">Izin</MenuItem>
                <MenuItem value="Sakit">Sakit</MenuItem>
                <MenuItem value="Cuti">Cuti</MenuItem>
                <MenuItem value="Alpha">Alpha</MenuItem>
              </TextField>
            </Grid>

            {/* Dari tanggal */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                type="date"
                fullWidth
                size="small"
                label="Dari Tanggal"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Sampai tanggal */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                type="date"
                fullWidth
                size="small"
                label="Sampai Tanggal"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Reset */}
            <Grid size={{ xs: 6, md: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                sx={{ height: 40 }}
                onClick={() => {
                  setFilterStatus("");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Reset
              </Button>
            </Grid>

            {/* Download PDF */}
            <Grid size={{ xs: 6, md: 2 }}>
              <Button
                fullWidth
                variant="contained"
                size="small"
                sx={{ height: 40 }}
                onClick={handleDownload}
              >
                ⬇ Download PDF
              </Button>
            </Grid>
          </Grid>

          {/* Info periode yang dipilih */}
          {(startDate || endDate) && (
            <Typography fontSize={12} color="text.secondary" mt={1}>
              Menampilkan:{" "}
              {startDate
                ? new Date(startDate + "T00:00:00").toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )
                : "awal"}{" "}
              s/d{" "}
              {endDate
                ? new Date(endDate + "T00:00:00").toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "sekarang"}
            </Typography>
          )}
        </Paper>

        {/* ── TABEL REKAP ───────────────────────────────────────────────────── */}
        <Paper sx={{ p: 2, borderRadius: 3, overflow: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Tanggal</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>Jam Masuk</TableCell>
                <TableCell>Area Masuk</TableCell>
                <TableCell>Jam Pulang</TableCell>
                <TableCell>Area Pulang</TableCell>
                <TableCell>Keterangan</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <TableRow
                    key={item.id}
                    sx={{ "&:hover": { backgroundColor: "#fafafa" } }}
                  >
                    <TableCell>{index + 1}</TableCell>

                    {/* Tanggal */}
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatTanggal(item.tanggal)}
                    </TableCell>

                    {/* Shift — tampilkan "-" untuk non-hadir */}
                    <TableCell>
                      {isNonHadir(item.status) ? "-" : item.shift_kode || "-"}
                    </TableCell>

                    {/* Jam Masuk */}
                    <TableCell>
                      {item.jam_masuk ? (
                        <Chip
                          label={item.jam_masuk}
                          color={
                            item.status === "Terlambat" ? "warning" : "default"
                          }
                          size="small"
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    {/* Area Masuk */}
                    <TableCell>
                      {isNonHadir(item.status) || !item.jam_masuk ? (
                        "-"
                      ) : (
                        <Chip
                          label={item.status_area || "-"}
                          color={
                            item.status_area === "DALAM" ? "success" : "warning"
                          }
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>

                    {/* Jam Pulang */}
                    <TableCell>
                      {item.jam_pulang ? (
                        <Chip label={item.jam_pulang} size="small" />
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    {/* Area Pulang */}
                    <TableCell>
                      {isNonHadir(item.status) || !item.jam_pulang ? (
                        "-"
                      ) : (
                        <Chip
                          label={item.status_area_pulang || "-"}
                          color={
                            item.status_area_pulang === "DALAM"
                              ? "success"
                              : "warning"
                          }
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>

                    {/* Keterangan:
                        - Non-hadir   → tampilkan keterangan (alasan izin/sakit/cuti/alpha)
                        - Hadir/Terlambat → tampilkan keterangan_pulang (tepat waktu / lembur) */}
                    <TableCell
                      sx={{
                        fontSize: 13,
                        color: "text.secondary",
                        minWidth: 160,
                      }}
                    >
                      {isNonHadir(item.status)
                        ? item.keterangan || "-"
                        : item.keterangan_pulang || "-"}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    Tidak ada data absensi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      {/* ── NOTIFIKASI ──────────────────────────────────────────────────────── */}
      <Snackbar
        open={notif.open}
        autoHideDuration={3000}
        onClose={() => setNotif({ ...notif, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={notif.severity} sx={{ width: "100%" }}>
          {notif.message}
        </Alert>
      </Snackbar>
    </DashboardLayoutPegawai>
  );
}
