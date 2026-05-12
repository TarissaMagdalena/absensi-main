import React, { useEffect, useState, useCallback } from "react";
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
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

const getStatusColor = (status) => {
  if (status === "Hadir") return "success";
  if (status === "Terlambat") return "warning";
  if (status === "Sakit") return "info";
  if (status === "Izin") return "default";
  if (status === "Cuti") return "secondary";
  if (status === "Alpha") return "error";
  return "default";
};

const SUMMARY_DEF = {
  hadir: 0,
  terlambat: 0,
  sakit: 0,
  izin: 0,
  cuti: 0,
  alpha: 0,
  total: 0,
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function LaporanAbsensi() {
  const [mode, setMode] = useState("per-pegawai"); // "per-pegawai" | "rekap-bulanan"

  // ── State: per-pegawai ──
  const [pegawai, setPegawai] = useState([]);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(SUMMARY_DEF);
  const [form, setForm] = useState({ pegawai_id: "", ...getBulanIniRange() });

  // ── State: rekap bulanan ──
  const [bulan, setBulan] = useState(getBulanIniValue()); // "YYYY-MM"
  const [rekapData, setRekapData] = useState([]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Fetch helpers
  // ═══════════════════════════════════════════════════════════════════════════
  const apiFetchDetail = useCallback(async (params) => {
    if (!params.pegawai_id || !params.start || !params.end) return;
    try {
      const res = await axios.get("http://localhost:5000/api/laporan", {
        params,
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setData(list);
      setSummary({
        hadir: list.filter((d) => d.status === "Hadir").length,
        terlambat: list.filter((d) => d.status === "Terlambat").length,
        sakit: list.filter((d) => d.status === "Sakit").length,
        izin: list.filter((d) => d.status === "Izin").length,
        cuti: list.filter((d) => d.status === "Cuti").length,
        alpha: list.filter((d) => d.status === "Alpha").length,
        total: list.length,
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const apiFetchRekap = useCallback(async (b) => {
    if (!b) return;
    try {
      const res = await axios.get(
        "http://localhost:5000/api/laporan/rekap-bulanan",
        {
          params: { bulan: b },
        },
      );
      setRekapData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // ── Inisialisasi pegawai ──
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/pegawai")
      .then((res) => {
        setPegawai(res.data);
        if (res.data.length > 0) {
          const def = { pegawai_id: res.data[0].id, ...getBulanIniRange() };
          setForm(def);
          apiFetchDetail(def);
        }
      })
      .catch(console.error);
  }, [apiFetchDetail]);

  // ── Auto-fetch detail ketika form berubah ──
  useEffect(() => {
    if (mode === "per-pegawai" && form.pegawai_id && form.start && form.end)
      apiFetchDetail(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pegawai_id, form.start, form.end, mode]);

  // ── Auto-fetch rekap ketika bulan / mode berubah ──
  useEffect(() => {
    if (mode === "rekap-bulanan") apiFetchRekap(bulan);
  }, [bulan, mode, apiFetchRekap]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Quick-date helpers (per-pegawai)
  // ═══════════════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════════════
  // Download
  // ═══════════════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════════════
  // Derived
  // ═══════════════════════════════════════════════════════════════════════════
  const namaPegawai = pegawai.find((p) => p.id == form.pegawai_id)?.nama || "";

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
    { label: "Alpha", value: summary.alpha, color: "#c62828", bg: "#ffebee" },
    { label: "Total", value: summary.total, color: "#212121", bg: "#eeeeee" },
  ];

  // ─── Format bulan untuk label ───
  const fmtBulan = (ym) =>
    new Date(ym + "-01T00:00:00").toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayoutAdmin>
      <Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="h5" fontWeight="bold">
            Laporan Absensi
          </Typography>

          {/* ── TOGGLE MODE ── */}
          <ToggleButtonGroup
            value={mode}
            exclusive
            size="small"
            onChange={(_, v) => {
              if (v) setMode(v);
            }}
          >
            <ToggleButton value="per-pegawai">Per Pegawai</ToggleButton>
            <ToggleButton value="rekap-bulanan">Rekap Bulanan</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* ══════════════════════════════════════════════════════════════════
            MODE: PER PEGAWAI
        ══════════════════════════════════════════════════════════════════ */}
        {mode === "per-pegawai" && (
          <>
            {/* FORM FILTER */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Typography fontWeight="bold">Buat Laporan Absensi</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Pilih pegawai dan periode
              </Typography>

              <Box display="flex" gap={1} mb={2}>
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
                alignItems="center"
                flexWrap="wrap"
                gap={2}
              >
                <Box display="flex" gap={2} flexWrap="wrap">
                  <TextField
                    select
                    size="small"
                    label="Pegawai"
                    value={form.pegawai_id}
                    sx={{ minWidth: 180 }}
                    onChange={(e) =>
                      setForm({ ...form, pegawai_id: e.target.value })
                    }
                  >
                    {pegawai.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.nama}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    type="date"
                    size="small"
                    label="Dari"
                    InputLabelProps={{ shrink: true }}
                    value={form.start}
                    onChange={(e) =>
                      setForm({ ...form, start: e.target.value })
                    }
                  />
                  <TextField
                    type="date"
                    size="small"
                    label="Sampai"
                    InputLabelProps={{ shrink: true }}
                    value={form.end}
                    onChange={(e) => setForm({ ...form, end: e.target.value })}
                  />
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={downloadDetailPDF}
                  sx={{ height: 40 }}
                >
                  Download PDF
                </Button>
              </Box>
            </Paper>

            {/* REKAP CARDS + TABEL */}
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography fontWeight="bold" mb={1}>
                Rekap Absensi — {namaPegawai || "..."}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Periode: {form.start ? fmtPeriode(form.start) : "-"} s/d{" "}
                {form.end ? fmtPeriode(form.end) : "-"}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box display="flex" gap={2} mb={3}>
                {SUMMARY_ITEMS.map((s) => (
                  <Box
                    key={s.label}
                    sx={{
                      flex: 1,
                      py: 1.5,
                      borderRadius: 2,
                      backgroundColor: s.bg,
                      textAlign: "center",
                      border: `1px solid ${s.bg}`,
                    }}
                  >
                    <Typography fontSize={24} fontWeight="bold" color={s.color}>
                      {s.value}
                    </Typography>
                    <Typography fontSize={12} color={s.color}>
                      {s.label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell>No</TableCell>
                      <TableCell>Tanggal</TableCell>
                      <TableCell>Shift</TableCell>
                      <TableCell>Jam Masuk</TableCell>
                      <TableCell>Area Masuk</TableCell>
                      <TableCell>Jam Pulang</TableCell>
                      <TableCell>Area Pulang</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Keterangan</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.length > 0 ? (
                      data.map((d, i) => {
                        const skipArea = ["Izin", "Sakit", "Cuti"].includes(
                          d.status,
                        );
                        const areaMasuk = skipArea ? "-" : d.status_area || "-";
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
                            sx={{ "&:hover": { backgroundColor: "#fafafa" } }}
                          >
                            <TableCell>{i + 1}</TableCell>
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
            </Paper>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODE: REKAP BULANAN
        ══════════════════════════════════════════════════════════════════ */}
        {mode === "rekap-bulanan" && (
          <>
            {/* FORM FILTER */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Typography fontWeight="bold">
                Rekap Absensi Semua Pegawai
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Pilih bulan
              </Typography>

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
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
                  sx={{ minWidth: 180 }}
                />

                {/* Tombol download: PDF & Excel */}
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={() => downloadRekap("pdf")}
                    sx={{ height: 40 }}
                  >
                    PDF
                  </Button>
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<TableChartIcon />}
                    onClick={() => downloadRekap("excel")}
                    sx={{ height: 40 }}
                  >
                    Excel
                  </Button>
                </Box>
              </Box>
            </Paper>

            {/* TABEL REKAP */}
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography fontWeight="bold" mb={1}>
                Rekap Bulanan — {bulan ? fmtBulan(bulan) : "..."}
              </Typography>
              <Divider sx={{ mb: 2 }} />

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
                        "Alpha",
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
                              label={r.hadir}
                              size="small"
                              color="success"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={r.terlambat}
                              size="small"
                              color="warning"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip label={r.sakit} size="small" color="info" />
                          </TableCell>
                          <TableCell>
                            <Chip label={r.izin} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={r.cuti}
                              size="small"
                              color="secondary"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip label={r.alpha} size="small" color="error" />
                          </TableCell>
                          <TableCell>
                            <strong>{r.total}</strong>
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
            </Paper>
          </>
        )}
      </Box>
    </DashboardLayoutAdmin>
  );
}
