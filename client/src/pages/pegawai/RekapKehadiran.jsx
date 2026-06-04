import { useState, useEffect } from "react";
import { apiFetch } from "../../utils/api";
import DashboardLayoutPegawai from "../../layout/DashboardLayoutPegawai";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

// ─── Helper ───────────────────────────────────────────────────────────────────
function getStatusColor(status) {
  const map = {
    Hadir: "success",
    Terlambat: "warning",
    Izin: "info",
    Sakit: "error",
    Cuti: "secondary",
    Alfa: "default",
  };
  return map[status] || "default";
}

const STATUS_NON_HADIR = ["Izin", "Sakit", "Cuti", "Alfa"];
const isNonHadir = (status) => STATUS_NON_HADIR.includes(status);

const formatTanggal = (tgl, short = false) =>
  new Date(tgl + "T00:00:00").toLocaleDateString(
    "id-ID",
    short
      ? { day: "numeric", month: "short", year: "2-digit" }
      : { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  );

const formatPeriode = (tgl) =>
  new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// ─── Komponen utama ───────────────────────────────────────────────────────────
export default function RekapKehadiran() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // < 600px

  // Ambil data user dari localStorage
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  // ── State ──────────────────────────────────────────────────────────────────
  const [data, setData] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [jatahCuti, setJatahCuti] = useState({
    jatah: 12,
    terpakai: 0,
    sisa: 12,
  });
  const [notif, setNotif] = useState({
    open: false,
    message: "",
    severity: "warning",
  });

  const showNotif = (message, severity = "warning") =>
    setNotif({ open: true, message, severity });

  // ── Fetch data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.pegawai_id) return;
    apiFetch(`http://localhost:5000/api/absensi/rekapan/${user.pegawai_id}`)
      .then((res) => res?.json())
      .then((json) => setData(Array.isArray(json) ? json : []))
      .catch((err) => console.error("Gagal ambil rekapan:", err));
  }, [user?.pegawai_id]);

  useEffect(() => {
    if (!user?.pegawai_id) return;
    const tahun = new Date().getFullYear();
    apiFetch(
      `http://localhost:5000/api/cuti/pegawai/${user.pegawai_id}?tahun=${tahun}`,
    )
      .then((res) => res?.json())
      .then((json) => {
        if (json) setJatahCuti(json);
      })
      .catch((err) => console.error("Gagal ambil jatah cuti:", err));
  }, [user?.pegawai_id]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredData = data.filter((item) => {
    const tgl = item.tanggal?.slice(0, 10);
    return (
      (filterStatus ? item.status === filterStatus : true) &&
      (startDate ? tgl >= startDate : true) &&
      (endDate ? tgl <= endDate : true)
    );
  });

  // ── Ringkasan ──────────────────────────────────────────────────────────────
  const totalTepat = filteredData.filter((d) => d.status === "Hadir").length;
  const totalTerlambat = filteredData.filter(
    (d) => d.status === "Terlambat",
  ).length;
  const totalTidakMasuk = filteredData.filter((d) =>
    ["Izin", "Sakit", "Cuti", "Alfa"].includes(d.status),
  ).length;

  // ── Download PDF ───────────────────────────────────────────────────────────
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

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayoutPegawai>
      <Box>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <Box mb={3}>
          <Typography variant="h5" fontWeight="bold">
            Rekap Kehadiran
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Riwayat dan rekap kehadiran kamu
          </Typography>
        </Box>

        {/* ── Kartu ringkasan — 2 kolom di mobile, 4 kolom di desktop ─────── */}
        <Box
          display="grid"
          gridTemplateColumns="repeat(4, 1fr)"
          gap={{ xs: 1, sm: 2 }}
          mb={3}
        >
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
                p: { xs: 1, sm: 2 },
                borderRadius: 3,
                backgroundColor: s.bg,
              }}
            >
              <Typography
                fontWeight="bold"
                color={s.color}
                sx={{ fontSize: { xs: 10, sm: 14 }, lineHeight: 1.3 }}
              >
                {s.label}
              </Typography>
              <Typography
                fontWeight="bold"
                color={s.color}
                mt={0.5}
                sx={{ fontSize: { xs: 18, sm: 24 } }}
              >
                {s.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* ── Filter — stack vertikal di mobile, horizontal di desktop ─────── */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          {isMobile ? (
            /* ── MOBILE: stack dengan tanggal & tombol 2 kolom ── */
            <Box display="flex" flexDirection="column" gap={1.5}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">Semua Status</MenuItem>
                {["Hadir", "Terlambat", "Izin", "Sakit", "Cuti", "Alfa"].map(
                  (s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ),
                )}
              </TextField>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  label="Dari"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  label="Sampai"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
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
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  sx={{ height: 40 }}
                  onClick={handleDownload}
                >
                  ⬇ Unduh PDF
                </Button>
              </Box>
            </Box>
          ) : (
            /* ── DESKTOP: layout horizontal asli ── */
            <Box
              display="grid"
              gridTemplateColumns="2fr 1.5fr 1.5fr auto auto"
              gap={1.5}
              alignItems="flex-end"
            >
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">Semua Status</MenuItem>
                {["Hadir", "Terlambat", "Izin", "Sakit", "Cuti", "Alfa"].map(
                  (s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ),
                )}
              </TextField>
              <TextField
                type="date"
                fullWidth
                size="small"
                label="Dari Tanggal"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="date"
                fullWidth
                size="small"
                label="Sampai Tanggal"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
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
              <Button
                fullWidth
                variant="contained"
                size="small"
                sx={{ height: 40 }}
                onClick={handleDownload}
              >
                ⬇ Unduh PDF
              </Button>
            </Box>
          )}

          {/* Info periode */}
          {(startDate || endDate) && (
            <Typography fontSize={12} color="text.secondary" mt={1.5}>
              Menampilkan: {startDate ? formatPeriode(startDate) : "awal"} s/d{" "}
              {endDate ? formatPeriode(endDate) : "sekarang"}
            </Typography>
          )}
        </Paper>

        {/* ── Tabel — card list di mobile, tabel biasa di desktop ──────────── */}
        {isMobile ? (
          // ── MOBILE: card per baris ──────────────────────────────────────
          <Box display="flex" flexDirection="column" gap={1.5}>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <Paper key={item.id} sx={{ p: 2, borderRadius: 3 }}>
                  {/* Baris atas: tanggal + status */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography fontSize={13} fontWeight="bold">
                      {formatTanggal(item.tanggal, true)}
                    </Typography>
                    <Chip
                      label={item.status}
                      color={getStatusColor(item.status)}
                      size="small"
                    />
                  </Box>

                  {/* Grid 2 kolom info */}
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={0.8}>
                    <Box>
                      <Typography fontSize={11} color="text.secondary">
                        Jadwal
                      </Typography>
                      <Typography fontSize={13}>
                        {isNonHadir(item.status) ? "-" : item.shift_kode || "-"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography fontSize={11} color="text.secondary">
                        Jam Masuk
                      </Typography>
                      {item.jam_masuk ? (
                        <Chip
                          label={item.jam_masuk}
                          size="small"
                          color={
                            item.status === "Terlambat" ? "warning" : "default"
                          }
                        />
                      ) : (
                        <Typography fontSize={13}>-</Typography>
                      )}
                    </Box>
                    <Box>
                      <Typography fontSize={11} color="text.secondary">
                        Area Masuk
                      </Typography>
                      {isNonHadir(item.status) || !item.jam_masuk ? (
                        <Typography fontSize={13}>-</Typography>
                      ) : (
                        <Chip
                          label={item.status_area || "-"}
                          size="small"
                          variant="outlined"
                          color={
                            item.status_area === "DALAM" ? "success" : "warning"
                          }
                        />
                      )}
                    </Box>
                    <Box>
                      <Typography fontSize={11} color="text.secondary">
                        Jam Pulang
                      </Typography>
                      {item.jam_pulang ? (
                        <Chip label={item.jam_pulang} size="small" />
                      ) : (
                        <Typography fontSize={13}>-</Typography>
                      )}
                    </Box>
                    <Box>
                      <Typography fontSize={11} color="text.secondary">
                        Area Pulang
                      </Typography>
                      {isNonHadir(item.status) || !item.jam_pulang ? (
                        <Typography fontSize={13}>-</Typography>
                      ) : (
                        <Chip
                          label={item.status_area_pulang || "-"}
                          size="small"
                          variant="outlined"
                          color={
                            item.status_area_pulang === "DALAM"
                              ? "success"
                              : "warning"
                          }
                        />
                      )}
                    </Box>
                    {/* Keterangan — full width */}
                    <Box gridColumn="1 / -1">
                      <Typography fontSize={11} color="text.secondary">
                        Keterangan
                      </Typography>
                      <Typography fontSize={13} color="text.secondary">
                        {isNonHadir(item.status)
                          ? item.keterangan || "-"
                          : item.keterangan_pulang || "-"}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))
            ) : (
              <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
                <Typography color="text.secondary">
                  Tidak ada data absensi
                </Typography>
              </Paper>
            )}
          </Box>
        ) : (
          // ── DESKTOP: tabel biasa ────────────────────────────────────────
          <Paper
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid #e5e7eb",
            }}
          >
            <Box sx={{ overflowX: "auto" }}>
              <Table
                sx={{
                  minWidth: 1000,
                  "& .MuiTableCell-root": {
                    py: 1.2,
                    px: 2,
                    fontSize: 13,
                    borderBottom: "1px solid #ececec",
                    verticalAlign: "middle",
                  },
                  "& .MuiTableHead-root .MuiTableCell-root": {
                    backgroundColor: "#f7f7f7",
                    fontWeight: 600,
                    color: "#444",
                    py: 1.5,
                  },
                  "& .MuiTableBody-root .MuiTableRow-root": { height: 56 },
                }}
              >
                <TableHead>
                  <TableRow>
                    {[
                      "No",
                      "Tanggal",
                      "Jadwal",
                      "Jam Masuk",
                      "Area Masuk",
                      "Jam Pulang",
                      "Area Pulang",
                      "Keterangan",
                      "Status",
                    ].map((h) => (
                      <TableCell key={h}>{h}</TableCell>
                    ))}
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
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {formatTanggal(item.tanggal)}
                        </TableCell>
                        <TableCell>
                          {isNonHadir(item.status)
                            ? "-"
                            : item.shift_kode || "-"}
                        </TableCell>
                        <TableCell>
                          {item.jam_masuk ? (
                            <Chip
                              label={item.jam_masuk}
                              color={
                                item.status === "Terlambat"
                                  ? "warning"
                                  : "default"
                              }
                              size="small"
                            />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {isNonHadir(item.status) || !item.jam_masuk ? (
                            "-"
                          ) : (
                            <Chip
                              label={item.status_area || "-"}
                              color={
                                item.status_area === "DALAM"
                                  ? "success"
                                  : "warning"
                              }
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {item.jam_pulang ? (
                            <Chip label={item.jam_pulang} size="small" />
                          ) : (
                            "-"
                          )}
                        </TableCell>
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
            </Box>
          </Paper>
        )}
      </Box>

      {/* ── Notifikasi ───────────────────────────────────────────────────────── */}
      <Snackbar
        open={notif.open}
        autoHideDuration={3000}
        onClose={() => setNotif((n) => ({ ...n, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={notif.severity}
          sx={{ width: "100%" }}
          onClose={() => setNotif((n) => ({ ...n, open: false }))}
        >
          {notif.message}
        </Alert>
      </Snackbar>
    </DashboardLayoutPegawai>
  );
}
