import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayoutAdmin from "../../layout/DashboardLayoutAdmin";
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Pagination,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER (di luar komponen — tidak perlu dibuat ulang setiap render)
// ═══════════════════════════════════════════════════════════════════════════════
const getBulanIniRange = () => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
  };
};

const getBulanIniValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const fmtTgl = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const fmtPeriode = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const fmtBulan = (ym) =>
  new Date(ym + "-01T00:00:00").toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

const getStatusColor = (status) => {
  if (status === "Hadir") return "success";
  if (status === "Terlambat") return "warning";
  if (status === "Sakit") return "info";
  if (status === "Izin") return "default";
  if (status === "Cuti") return "secondary";
  if (status === "Alfa") return "error";
  return "default";
};

const SUMMARY_DEF = {
  hadir: 0,
  terlambat: 0,
  sakit: 0,
  izin: 0,
  cuti: 0,
  Alfa: 0,
  total: 0,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN (dipindah keluar dari komponen utama agar tidak dibuat ulang
// setiap render — ini yang memicu error react-hooks/static-components)
// ═══════════════════════════════════════════════════════════════════════════════

// ── Card detail absensi per baris (tampilan mobile) ──────────────────────────
function DetailCard({ d, index }) {
  const skipArea = ["Izin", "Sakit", "Cuti"].includes(d.status);
  const keterangan =
    [d.keterangan, d.keterangan_pulang].filter(Boolean).join(" · ") || null;
  return (
    <Card variant="outlined" sx={{ mb: 1.5, borderRadius: 2 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              fontSize={11}
              sx={{
                backgroundColor: "#f0f0f0",
                borderRadius: "50%",
                width: 22,
                height: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                color: "#555",
              }}
            >
              {index + 1}
            </Typography>
            <Box>
              <Typography fontSize={13} fontWeight="bold">
                {fmtTgl(d.tanggal)}
              </Typography>
              {d.shift_kode && (
                <Typography fontSize={11} color="text.secondary">
                  Jadwal {d.shift_kode}
                </Typography>
              )}
            </Box>
          </Box>
          <Chip
            label={d.status}
            color={getStatusColor(d.status)}
            size="small"
          />
        </Box>
        <Divider sx={{ mb: 1 }} />
        {!skipArea && (
          <Box display="flex" gap={2}>
            <Box flex={1}>
              <Typography fontSize={11} color="text.secondary" mb={0.5}>
                Jam Masuk
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                {d.jam_masuk ? (
                  <>
                    <Chip
                      label={d.jam_masuk}
                      size="small"
                      color={d.status === "Terlambat" ? "warning" : "default"}
                    />
                    <Chip
                      label={d.status_area || "-"}
                      size="small"
                      color={d.status_area === "DALAM" ? "success" : "warning"}
                      variant="outlined"
                    />
                  </>
                ) : (
                  <Typography fontSize={12} color="text.secondary">
                    -
                  </Typography>
                )}
              </Box>
            </Box>
            <Box flex={1}>
              <Typography fontSize={11} color="text.secondary" mb={0.5}>
                Jam Pulang
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                {d.jam_pulang ? (
                  <>
                    <Chip label={d.jam_pulang} size="small" />
                    <Chip
                      label={d.status_area_pulang || "-"}
                      size="small"
                      color={
                        d.status_area_pulang === "DALAM" ? "success" : "warning"
                      }
                      variant="outlined"
                    />
                  </>
                ) : (
                  <Typography fontSize={12} color="text.secondary">
                    -
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}
        {keterangan && (
          <Box
            mt={skipArea ? 0 : 1}
            pt={skipArea ? 0 : 1}
            sx={{ borderTop: skipArea ? "none" : "1px solid #f0f0f0" }}
          >
            <Typography fontSize={11} color="text.secondary" mb={0.3}>
              Keterangan
            </Typography>
            <Typography fontSize={12}>{keterangan}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ── Card rekap bulanan per pegawai (tampilan mobile) ──────────────────────────
function RekapCard({ r, i }) {
  const items = [
    { label: "Hadir", value: Number(r.hadir), color: "success" },
    { label: "Terlambat", value: Number(r.terlambat), color: "warning" },
    { label: "Sakit", value: Number(r.sakit), color: "info" },
    { label: "Izin", value: Number(r.izin), color: "default" },
    { label: "Cuti", value: Number(r.cuti), color: "secondary" },
    { label: "Alfa", value: Number(r.alfa), color: "error" },
  ];
  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        borderRadius: 2,
        backgroundColor: i % 2 === 0 ? "#fff" : "#f9f9f9",
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={1}
        >
          <Box>
            <Typography fontSize={14} fontWeight="bold">
              {r.nama}
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              {r.nik}
            </Typography>
          </Box>
          <Chip
            label={`Total: ${Number(r.total)} hari`}
            size="small"
            sx={{
              backgroundColor: "#eeeeee",
              fontWeight: "bold",
              fontSize: 11,
            }}
          />
        </Box>
        <Divider sx={{ mb: 1 }} />
        <Box display="flex" gap={0.8} flexWrap="wrap">
          {items.map((item) => (
            <Chip
              key={item.label}
              label={`${item.label}: ${item.value}`}
              size="small"
              color={item.color}
              variant={item.color === "default" ? "outlined" : "filled"}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Pagination bar (dipindah keluar — props dilewatkan eksplisit) ────────────
function PaginationBar({
  dataLength,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  totalPages,
  isMobile,
}) {
  if (dataLength === 0) return null;
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={1.5}
      mt={2}
      px={0.5}
    >
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
          dari <strong>{dataLength}</strong> data
        </Typography>
      </Box>
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
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════════
export default function LaporanAbsensi() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [mode, setMode] = useState("per-pegawai");
  const [pegawai, setPegawai] = useState([]);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(SUMMARY_DEF);
  const [form, setForm] = useState({ pegawai_id: "", ...getBulanIniRange() });
  const [bulan, setBulan] = useState(getBulanIniValue());
  const [rekapData, setRekapData] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── Load daftar pegawai + set default form sekali di awal ────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/pegawai");
        if (!active) return;
        setPegawai(res.data);
        if (res.data.length > 0) {
          const def = { pegawai_id: res.data[0].id, ...getBulanIniRange() };
          setForm(def);
        }
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // ── Trigger fetch detail saat filter mode per-pegawai berubah ────────────
  // Pola "ignore flag" — pola resmi React untuk data fetching di useEffect.
  // setState hanya terjadi di dalam closure async lokal (run()), bukan
  // langsung di body effect, sehingga tidak lagi memicu set-state-in-effect.
  useEffect(() => {
    if (mode !== "per-pegawai") return;
    if (!form.pegawai_id || !form.start || !form.end) return;

    let ignore = false;

    async function run() {
      try {
        const res = await axios.get("http://localhost:5000/api/laporan", {
          params: {
            pegawai_id: form.pegawai_id,
            start: form.start,
            end: form.end,
          },
        });
        if (ignore) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setData(list);
        setPage(1);
        setSummary({
          hadir: list.filter((d) => d.status === "Hadir").length,
          terlambat: list.filter((d) => d.status === "Terlambat").length,
          sakit: list.filter((d) => d.status === "Sakit").length,
          izin: list.filter((d) => d.status === "Izin").length,
          cuti: list.filter((d) => d.status === "Cuti").length,
          Alfa: list.filter((d) => d.status === "Alfa").length,
          total: list.length,
        });
      } catch (err) {
        if (!ignore) console.error(err);
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [form.pegawai_id, form.start, form.end, mode]);

  // ── Trigger fetch rekap saat mode rekap-bulanan aktif ─────────────────────
  useEffect(() => {
    if (mode !== "rekap-bulanan") return;
    if (!bulan) return;

    let ignore = false;

    async function run() {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/laporan/rekap-bulanan",
          {
            params: { bulan },
          },
        );
        if (ignore) return;
        setRekapData(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!ignore) console.error(err);
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [bulan, mode]);

  // ── Preset rentang tanggal ────────────────────────────────────────────────
  const setMingguIni = () => {
    const now = new Date();
    const diff = now.getDay() === 0 ? -6 : 1 - now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    setForm((f) => ({
      ...f,
      start: mon.toISOString().split("T")[0],
      end: sun.toISOString().split("T")[0],
    }));
  };
  const setBulanIni = () => setForm((f) => ({ ...f, ...getBulanIniRange() }));
  const setBulanLalu = () => {
    const now = new Date();
    setForm((f) => ({
      ...f,
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString()
        .split("T")[0],
      end: new Date(now.getFullYear(), now.getMonth(), 0)
        .toISOString()
        .split("T")[0],
    }));
  };

  // ── Download ──────────────────────────────────────────────────────────────
  const downloadDetailPDF = () => {
    if (!form.pegawai_id || !form.start || !form.end)
      return alert("Lengkapi form dulu!");
    window.open(
      `http://localhost:5000/api/laporan/download?pegawai_id=${form.pegawai_id}&start=${form.start}&end=${form.end}`,
    );
  };
  const downloadRekap = (format) => {
    if (!bulan) return alert("Pilih bulan dulu!");
    window.open(
      `http://localhost:5000/api/laporan/rekap-bulanan/download?bulan=${bulan}&format=${format}`,
    );
  };

  // ── Derived values ───────────────────────────────────────────────────────
  const namaPegawai = pegawai.find((p) => p.id == form.pegawai_id)?.nama || "";
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const paginatedData = data.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const SUMMARY_ITEMS = [
    { label: "Hadir", value: summary.hadir, color: "#2e7d32", bg: "#e8f5e9" },
    {
      label: "Terlambat",
      value: summary.terlambat,
      color: "#e65100",
      bg: "#fff3e0",
    },
    { label: "Sakit", value: summary.sakit, color: "#0277bd", bg: "#e1f5fe" },
    { label: "Izin", value: summary.izin, color: "#555", bg: "#f5f5f5" },
    { label: "Cuti", value: summary.cuti, color: "#6a1b9a", bg: "#f3e5f5" },
    { label: "Alfa", value: summary.Alfa, color: "#c62828", bg: "#ffebee" },
    { label: "Total", value: summary.total, color: "#212121", bg: "#eeeeee" },
  ];

  return (
    <DashboardLayoutAdmin>
      <Box>
        {/* HEADER */}
        <Box
          display="flex"
          alignItems={isMobile ? "flex-start" : "center"}
          justifyContent="space-between"
          flexDirection={isMobile ? "column" : "row"}
          gap={isMobile ? 1.5 : 0}
          mb={2}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Laporan Absensi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rekap dan analisis data kehadiran pegawai berdasarkan periode
            </Typography>
          </Box>
          <ToggleButtonGroup
            value={mode}
            exclusive
            size="small"
            onChange={(_, v) => {
              if (v) setMode(v);
            }}
            sx={{ width: isMobile ? "100%" : "auto" }}
          >
            <ToggleButton
              value="per-pegawai"
              sx={{ flex: isMobile ? 1 : "auto" }}
            >
              Rekap Per Pegawai
            </ToggleButton>
            <ToggleButton
              value="rekap-bulanan"
              sx={{ flex: isMobile ? 1 : "auto" }}
            >
              Rekap Bulanan
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* ══ MODE: PER PEGAWAI ══ */}
        {mode === "per-pegawai" && (
          <>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Typography fontWeight="bold">Buat Laporan Absensi</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Pilih pegawai dan periode
              </Typography>
              <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                <Button size="small" variant="outlined" onClick={setMingguIni}>
                  Minggu Ini
                </Button>
                <Button size="small" variant="outlined" onClick={setBulanIni}>
                  Bulan Ini
                </Button>
                <Button size="small" variant="outlined" onClick={setBulanLalu}>
                  Bulan Lalu
                </Button>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems={isMobile ? "stretch" : "center"}
                flexDirection={isMobile ? "column" : "row"}
                flexWrap="wrap"
                gap={2}
              >
                <Box
                  display="flex"
                  gap={2}
                  flexWrap="wrap"
                  flexDirection={isMobile ? "column" : "row"}
                  width={isMobile ? "100%" : "auto"}
                >
                  <TextField
                    select
                    size="small"
                    label="Pegawai"
                    value={form.pegawai_id}
                    sx={{ minWidth: 180, width: isMobile ? "100%" : "auto" }}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, pegawai_id: e.target.value }))
                    }
                  >
                    {pegawai.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.nama}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Box
                    display="flex"
                    gap={2}
                    width={isMobile ? "100%" : "auto"}
                  >
                    <TextField
                      type="date"
                      size="small"
                      label="Dari"
                      InputLabelProps={{ shrink: true }}
                      value={form.start}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, start: e.target.value }))
                      }
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      type="date"
                      size="small"
                      label="Sampai"
                      InputLabelProps={{ shrink: true }}
                      value={form.end}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, end: e.target.value }))
                      }
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={downloadDetailPDF}
                  sx={{ height: 40, width: isMobile ? "100%" : "auto" }}
                >
                  Unduh PDF
                </Button>
              </Box>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography fontWeight="bold" mb={1}>
                Rekap Absensi — {namaPegawai || "..."}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Periode: {form.start ? fmtPeriode(form.start) : "-"} s/d{" "}
                {form.end ? fmtPeriode(form.end) : "-"}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box
                display="flex"
                gap={isMobile ? 1 : 2}
                mb={3}
                flexWrap={isMobile ? "wrap" : "nowrap"}
              >
                {SUMMARY_ITEMS.map((s) => (
                  <Box
                    key={s.label}
                    sx={{
                      flex: isMobile ? "0 0 calc(25% - 6px)" : 1,
                      py: 1.5,
                      borderRadius: 2,
                      backgroundColor: s.bg,
                      textAlign: "center",
                      border: `1px solid ${s.bg}`,
                    }}
                  >
                    <Typography
                      fontSize={isMobile ? 18 : 24}
                      fontWeight="bold"
                      color={s.color}
                    >
                      {s.value}
                    </Typography>
                    <Typography fontSize={isMobile ? 10 : 12} color={s.color}>
                      {s.label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {isMobile ? (
                <Box>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((d, i) => (
                      <DetailCard
                        key={i}
                        d={d}
                        index={(page - 1) * rowsPerPage + i}
                      />
                    ))
                  ) : (
                    <Typography
                      align="center"
                      color="text.secondary"
                      py={4}
                      fontSize={14}
                    >
                      Tidak ada data absensi pada periode ini
                    </Typography>
                  )}
                  <PaginationBar
                    dataLength={data.length}
                    page={page}
                    setPage={setPage}
                    rowsPerPage={rowsPerPage}
                    setRowsPerPage={setRowsPerPage}
                    totalPages={totalPages}
                    isMobile={isMobile}
                  />
                </Box>
              ) : (
                <>
                  <Box sx={{ overflowX: "auto" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                          <TableCell>No</TableCell>
                          <TableCell>Tanggal</TableCell>
                          <TableCell>Jadwal</TableCell>
                          <TableCell>Jam Masuk</TableCell>
                          <TableCell>Area Masuk</TableCell>
                          <TableCell>Jam Pulang</TableCell>
                          <TableCell>Area Pulang</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Keterangan</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedData.length > 0 ? (
                          paginatedData.map((d, i) => {
                            const skipArea = ["Izin", "Sakit", "Cuti"].includes(
                              d.status,
                            );
                            const areaMasuk = skipArea
                              ? "-"
                              : d.status_area || "-";
                            const areaPulang = skipArea
                              ? "-"
                              : d.status_area_pulang || "-";
                            const keterangan =
                              [d.keterangan, d.keterangan_pulang]
                                .filter(Boolean)
                                .join(" · ") || "-";
                            return (
                              <TableRow
                                key={i}
                                sx={{
                                  "&:hover": { backgroundColor: "#fafafa" },
                                }}
                              >
                                <TableCell>
                                  {(page - 1) * rowsPerPage + i + 1}
                                </TableCell>
                                <TableCell sx={{ whiteSpace: "nowrap" }}>
                                  {fmtTgl(d.tanggal)}
                                </TableCell>
                                <TableCell>{d.shift_kode || "-"}</TableCell>
                                <TableCell>
                                  {d.jam_masuk ? (
                                    <Chip
                                      label={d.jam_masuk}
                                      size="small"
                                      color={
                                        d.status === "Terlambat"
                                          ? "warning"
                                          : "default"
                                      }
                                    />
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell>
                                  {d.jam_masuk && !skipArea ? (
                                    <Chip
                                      label={areaMasuk}
                                      size="small"
                                      color={
                                        areaMasuk === "DALAM"
                                          ? "success"
                                          : "warning"
                                      }
                                      variant="outlined"
                                    />
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell>{d.jam_pulang || "-"}</TableCell>
                                <TableCell>
                                  {d.jam_pulang && !skipArea ? (
                                    <Chip
                                      label={areaPulang}
                                      size="small"
                                      color={
                                        areaPulang === "DALAM"
                                          ? "success"
                                          : "warning"
                                      }
                                      variant="outlined"
                                    />
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={d.status}
                                    color={getStatusColor(d.status)}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell
                                  sx={{
                                    fontSize: 13,
                                    color: "text.secondary",
                                    minWidth: 160,
                                  }}
                                >
                                  {keterangan}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={9}
                              align="center"
                              sx={{ py: 4, color: "text.secondary" }}
                            >
                              Tidak ada data absensi pada periode ini
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                  <PaginationBar
                    dataLength={data.length}
                    page={page}
                    setPage={setPage}
                    rowsPerPage={rowsPerPage}
                    setRowsPerPage={setRowsPerPage}
                    totalPages={totalPages}
                    isMobile={isMobile}
                  />
                </>
              )}
            </Paper>
          </>
        )}

        {/* ══ MODE: REKAP BULANAN ══ */}
        {mode === "rekap-bulanan" && (
          <>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Typography fontWeight="bold">Rekap Absensi Pegawai</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Pilih bulan
              </Typography>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems={isMobile ? "stretch" : "center"}
                flexDirection={isMobile ? "column" : "row"}
                flexWrap="wrap"
                gap={2}
              >
                <TextField
                  type="month"
                  size="small"
                  label="Bulan"
                  InputLabelProps={{ shrink: true }}
                  value={bulan}
                  onChange={(e) => setBulan(e.target.value)}
                  sx={{ minWidth: 180, width: isMobile ? "100%" : "auto" }}
                />
                <Box display="flex" gap={1} width={isMobile ? "100%" : "auto"}>
                  <Button
                    variant="outlined"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={() => downloadRekap("pdf")}
                    sx={{ height: 40, flex: isMobile ? 1 : "auto" }}
                  >
                    PDF
                  </Button>
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<TableChartIcon />}
                    onClick={() => downloadRekap("excel")}
                    sx={{ height: 40, flex: isMobile ? 1 : "auto" }}
                  >
                    Excel
                  </Button>
                </Box>
              </Box>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography fontWeight="bold" mb={1}>
                Rekap Absensi Bulanan — {bulan ? fmtBulan(bulan) : "..."}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {isMobile ? (
                <Box>
                  {rekapData.length > 0 ? (
                    rekapData.map((r, i) => (
                      <RekapCard key={r.pegawai_id} r={r} i={i} />
                    ))
                  ) : (
                    <Typography
                      align="center"
                      color="text.secondary"
                      py={4}
                      fontSize={14}
                    >
                      Tidak ada data untuk bulan ini
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#1a3c6e" }}>
                        {[
                          "No",
                          "Nama Pegawai",
                          "NIK",
                          "Hadir",
                          "Terlambat",
                          "Sakit",
                          "Izin",
                          "Cuti",
                          "Alfa",
                          "Total Hari",
                        ].map((h) => (
                          <TableCell
                            key={h}
                            sx={{
                              color: "#fff",
                              fontWeight: "bold",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rekapData.length > 0 ? (
                        rekapData.map((r, i) => (
                          <TableRow
                            key={r.pegawai_id}
                            sx={{
                              backgroundColor: i % 2 === 0 ? "#fff" : "#f9f9f9",
                              "&:hover": { backgroundColor: "#f0f4ff" },
                            }}
                          >
                            <TableCell>{i + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>
                              {r.nama}
                            </TableCell>
                            <TableCell sx={{ color: "text.secondary" }}>
                              {r.nik}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={Number(r.hadir)}
                                size="small"
                                color="success"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={Number(r.terlambat)}
                                size="small"
                                color="warning"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={Number(r.sakit)}
                                size="small"
                                color="info"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip label={Number(r.izin)} size="small" />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={Number(r.cuti)}
                                size="small"
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={Number(r.alfa)}
                                size="small"
                                color="error"
                              />
                            </TableCell>
                            <TableCell>
                              <strong>{Number(r.total)}</strong>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={10}
                            align="center"
                            sx={{ py: 4, color: "text.secondary" }}
                          >
                            Tidak ada data untuk bulan ini
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Paper>
          </>
        )}
      </Box>
    </DashboardLayoutAdmin>
  );
}
