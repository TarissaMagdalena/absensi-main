import { useState, useEffect } from "react";
import { apiFetch } from "../../utils/api";
import DashboardLayoutPegawai from "../../layout/DashboardLayoutPegawai";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Pagination,
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

// Catatan: formatPeriode dihapus karena tidak pernah dipakai di JSX —
// kalau nanti perlu menampilkan "Periode: ... s/d ...", panggil ulang
// helper ini di tempat yang membutuhkan.

const getBulanIni = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// ─── Komponen utama ───────────────────────────────────────────────────────────
export default function RekapKehadiran() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
  const [bulan, setBulan] = useState(getBulanIni());
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

  // ── Pagination state ───────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const showNotif = (message, severity = "warning") =>
    setNotif({ open: true, message, severity });

  // ── Fetch data rekapan berdasarkan bulan ───────────────────────────────────
  useEffect(() => {
    if (!user?.pegawai_id) return;

    let ignore = false;

    // Hitung range dari bulan yang dipilih
    const [year, month] = bulan.split("-").map(Number);
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    (async () => {
      try {
        const res = await apiFetch(
          `http://localhost:5000/api/absensi/rekapan/${user.pegawai_id}?start=${start}&end=${end}`,
        );
        const json = await res?.json();
        if (ignore) return;
        setData(Array.isArray(json) ? json : []);
      } catch (err) {
        if (!ignore) console.error("Gagal ambil rekapan:", err);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [user?.pegawai_id, bulan]);

  // ── Fetch jatah cuti ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.pegawai_id) return;

    let ignore = false;
    const tahun = new Date().getFullYear();

    (async () => {
      try {
        const res = await apiFetch(
          `http://localhost:5000/api/cuti/pegawai/${user.pegawai_id}?tahun=${tahun}`,
        );
        const json = await res?.json();
        if (ignore) return;
        if (json) setJatahCuti(json);
      } catch (err) {
        if (!ignore) console.error("Gagal ambil jatah cuti:", err);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [user?.pegawai_id]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  // Catatan: reset halaman ke 1 digabung langsung ke setter filter (bukan
  // effect terpisah) supaya tidak memicu warning set-state-in-effect.
  // Filter pakai derived state biasa — tidak butuh effect sama sekali.
  const filteredData = data.filter((item) => {
    const tgl = item.tanggal?.slice(0, 10);
    return (
      (filterStatus ? item.status === filterStatus : true) &&
      (startDate ? tgl >= startDate : true) &&
      (endDate ? tgl <= endDate : true)
    );
  });

  // Helper untuk update filter + reset page sekaligus, dipanggil dari onChange
  const updateFilterStatus = (value) => {
    setFilterStatus(value);
    setPage(1);
  };
  const updateStartDate = (value) => {
    setStartDate(value);
    setPage(1);
  };
  const updateEndDate = (value) => {
    setEndDate(value);
    setPage(1);
  };
  const updateBulan = (value) => {
    setBulan(value);
    setStartDate("");
    setEndDate("");
    setPage(1);
  };
  const resetFilter = () => {
    setFilterStatus("");
    setStartDate("");
    setEndDate("");
    setBulan(getBulanIni());
    setPage(1);
  };

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

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

        {/* ── Kartu ringkasan ─────────────────────────────────────────────── */}
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

        {/* ── Filter ──────────────────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          {isMobile ? (
            <Box display="flex" flexDirection="column" gap={1.5}>
              {/* Baris 1: Bulan (full width) */}
              <TextField
                type="month"
                fullWidth
                size="small"
                label="Bulan"
                value={bulan}
                onChange={(e) => updateBulan(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              {/* Baris 3: Dari & Sampai */}
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  label="Dari"
                  value={startDate}
                  onChange={(e) => updateStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  label="Sampai"
                  value={endDate}
                  onChange={(e) => updateEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              {/* Baris 2: Status (full width) */}
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={filterStatus}
                onChange={(e) => updateFilterStatus(e.target.value)}
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

              {/* Baris 4: Tombol */}
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={{ height: 40 }}
                  onClick={resetFilter}
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
            <Box display="flex" flexDirection="column" gap={1.5}>
              {/* Baris 1: Bulan + Status + Tanggal + Tombol */}
              <Box
                display="grid"
                gridTemplateColumns="1.5fr 1.5fr 1.5fr 1.5fr auto auto"
                gap={1.5}
                alignItems="flex-end"
              >
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status"
                  value={filterStatus}
                  onChange={(e) => updateFilterStatus(e.target.value)}
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
                  type="month"
                  fullWidth
                  size="small"
                  label="Bulan"
                  value={bulan}
                  onChange={(e) => updateBulan(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  label="Dari Tanggal"
                  value={startDate}
                  onChange={(e) => updateStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  label="Sampai Tanggal"
                  value={endDate}
                  onChange={(e) => updateEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />

                <Button
                  variant="outlined"
                  size="small"
                  sx={{ height: 40, whiteSpace: "nowrap" }}
                  onClick={resetFilter}
                >
                  Reset
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ height: 40, whiteSpace: "nowrap" }}
                  onClick={handleDownload}
                >
                  ⬇ Unduh PDF
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        {/* ── Tabel / Card ────────────────────────────────────────────────── */}
        {isMobile ? (
          <Box display="flex" flexDirection="column" gap={1.5}>
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <Paper key={item.id} sx={{ p: 2, borderRadius: 3 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Box>
                      <Typography fontSize={13} fontWeight="bold">
                        {formatTanggal(item.tanggal, true)}
                      </Typography>
                      {item.shift_kode && !isNonHadir(item.status) && (
                        <Typography fontSize={11} color="text.secondary">
                          Shift {item.shift_kode}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={item.status}
                      color={getStatusColor(item.status)}
                      size="small"
                    />
                  </Box>

                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={0.8}>
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
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item, index) => (
                      <TableRow
                        key={item.id}
                        sx={{ "&:hover": { backgroundColor: "#fafafa" } }}
                      >
                        {/* Nomor urut global */}
                        <TableCell>
                          {(page - 1) * rowsPerPage + index + 1}
                        </TableCell>
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
                              size="small"
                              color={
                                item.status === "Terlambat"
                                  ? "warning"
                                  : "default"
                              }
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
                              size="small"
                              variant="outlined"
                              color={
                                item.status_area === "DALAM"
                                  ? "success"
                                  : "warning"
                              }
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
                              size="small"
                              variant="outlined"
                              color={
                                item.status_area_pulang === "DALAM"
                                  ? "success"
                                  : "warning"
                              }
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

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {filteredData.length > 0 && (
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={1.5}
            mt={2}
            px={0.5}
          >
            {/* Kiri: pilih jumlah baris */}
            <Box display="flex" alignItems="center" gap={1}>
              <Typography fontSize={13} color="text.secondary">
                Tampilkan
              </Typography>
              <TextField
                select
                size="small"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                sx={{ width: 75 }}
              >
                {[10, 25, 50].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </TextField>
              <Typography fontSize={13} color="text.secondary">
                dari <strong>{filteredData.length}</strong> data
              </Typography>
            </Box>

            {/* Kanan: nomor halaman */}
            <Box display="flex" alignItems="center" gap={1.5}>
              <Typography fontSize={13} color="text.secondary">
                Hal. <strong>{page}</strong> / <strong>{totalPages}</strong>
              </Typography>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, val) => setPage(val)}
                color="primary"
                shape="rounded"
                size={isMobile ? "small" : "medium"}
                showFirstButton
                showLastButton
              />
            </Box>
          </Box>
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
