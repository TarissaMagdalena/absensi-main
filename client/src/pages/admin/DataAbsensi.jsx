// ═══════════════════════════════════════════════════════════════
// DATA ABSENSI — Halaman admin untuk CRUD data absensi pegawai
// ═══════════════════════════════════════════════════════════════
import React, { useEffect, useState, useCallback } from "react";
import { api } from "../../utils/api";
import DashboardLayoutAdmin from "../../layout/DashboardLayoutAdmin";
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
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  Divider,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Stack,
  Pagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

// ── Form kosong untuk reset setelah tambah/edit ───────────────────────────────
const emptyForm = {
  pegawai_id: "",
  tanggal: "",
  status: "",
  keterangan: "",
  shift_kode: "",
};
// ── Warna chip status absensi ───────────────────────────────────────────────
const getStatusColor = (s) => {
  if (s === "Hadir") return "success";
  if (s === "Terlambat") return "warning";
  if (s === "Izin") return "info";
  if (s === "Sakit") return "error";
  if (s === "Cuti") return "secondary";
  return "default";
};
// ── Format tanggal ke bahasa Indonesia ───────────────────────────────────────
const formatTanggal = (tgl) =>
  new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// ── Card mobile ───────────────────────────────────────────────────────────────
function AbsensiCard({ item, index, onEdit, onDelete, isCutiDariJadwal }) {
  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 3, mb: 1.5, "&:hover": { boxShadow: 2 } }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        {/* Baris atas: nama + status */}
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
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography fontWeight="bold" fontSize={14}>
                {item.nama}
              </Typography>
              {item.is_suspicious === 1 && (
                <Tooltip
                  title={`Lokasi mencurigakan — akurasi GPS terlalu sempurna (±${item.accuracy}m), kemungkinan menggunakan fake GPS`}
                >
                  <WarningAmberIcon sx={{ fontSize: 15, color: "#f57c00" }} />
                </Tooltip>
              )}
            </Box>
          </Box>
          <Chip
            label={item.status}
            color={getStatusColor(item.status)}
            size="small"
          />
        </Box>

        {/* Tanggal + shift */}
        <Typography fontSize={12} color="text.secondary" mb={1}>
          {formatTanggal(item.tanggal)}
          {item.shift_kode && (
            <Box
              component="span"
              sx={{ ml: 1, fontWeight: "bold", color: "#333" }}
            >
              · Shift {item.shift_kode}
            </Box>
          )}
        </Typography>

        {/* Chip jam masuk/pulang + area */}
        {(item.jam_masuk || item.jam_pulang) && (
          <Stack direction="row" spacing={1} mb={1} flexWrap="wrap">
            {item.jam_masuk && (
              <Chip
                label={`Masuk: ${item.jam_masuk}`}
                color={item.status === "Terlambat" ? "warning" : "default"}
                size="small"
              />
            )}
            {item.status_area && item.jam_masuk && (
              <Chip
                label={item.status_area}
                color={item.status_area === "DALAM" ? "success" : "warning"}
                size="small"
                variant="outlined"
              />
            )}
            {item.jam_pulang && (
              <Chip label={`Pulang: ${item.jam_pulang}`} size="small" />
            )}
            {item.status_area_pulang && item.jam_pulang && (
              <Chip
                label={item.status_area_pulang}
                color={
                  item.status_area_pulang === "DALAM" ? "success" : "warning"
                }
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        )}

        {/* Warning fake GPS */}
        {item.is_suspicious === 1 && (
          <Box
            sx={{
              mb: 1,
              p: 1,
              borderRadius: 1.5,
              backgroundColor: "#fff3e0",
              border: "1px solid #ffcc02",
            }}
          >
            <Typography fontSize={11} color="#e65100">
              ⚠️ Lokasi mencurigakan — akurasi GPS terlalu sempurna (±
              {item.accuracy}m)
            </Typography>
          </Box>
        )}

        {/* Info manual admin */}
        {item.keterangan?.includes("Diabsensi manual oleh admin") && (
          <Box
            sx={{
              mb: 1,
              p: 1,
              borderRadius: 1.5,
              backgroundColor: "#e3f2fd",
              border: "1px solid #90caf9",
            }}
          >
            <Typography fontSize={11} color="#1565c0">
              ℹ️ Absensi ini dicatat manual oleh admin
            </Typography>
          </Box>
        )}

        {/* Keterangan */}
        {(item.keterangan || item.keterangan_pulang) && (
          <Typography fontSize={12} color="text.secondary" mb={1}>
            {item.keterangan || item.keterangan_pulang}
          </Typography>
        )}

        {/* Footer card: koordinat + aksi */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={0.5}>
            {item.latitude && item.longitude && (
              <Tooltip
                title={`Jarak: ${item.distance ? Math.round(item.distance) + " m" : "-"}`}
              >
                <IconButton
                  size="small"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps?q=${item.latitude},${item.longitude}`,
                      "_blank",
                    )
                  }
                  sx={{
                    color: item.status_area === "DALAM" ? "#2e7d32" : "#c62828",
                  }}
                >
                  <LocationOnIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {item.surat_mc && (
              <Tooltip title="Lihat Surat MC">
                <IconButton
                  size="small"
                  onClick={() =>
                    window.open(
                      `http://localhost:5000/uploads/surat_mc/${item.surat_mc}`,
                      "_blank",
                    )
                  }
                  sx={{ color: "#1565c0" }}
                >
                  <AttachFileIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
            {item.surat_cuti && (
              <Tooltip title="Lihat Surat Cuti">
                <IconButton
                  size="small"
                  onClick={() =>
                    window.open(
                      `http://localhost:5000/uploads/surat_cuti/${item.surat_cuti}`,
                      "_blank",
                    )
                  }
                  sx={{ color: "#1565c0" }}
                >
                  <AttachFileIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => onEdit(item)}
                sx={{ color: "#1565c0" }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {isCutiDariJadwal(item) ? (
              <Tooltip title="Untuk membatalkan cuti, ubah jadwal shift di halaman Jadwal Shift">
                <IconButton size="small" sx={{ color: "#bbb" }}>
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Hapus">
                <IconButton
                  size="small"
                  onClick={() => onDelete(item)}
                  sx={{ color: "#c62828" }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Komponen utama ────────────────────────────────────────────────────────────
export default function DataAbsensi() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  // ════════════════════════════════════════════════════════════
  // STATE — semua state komponen
  // ════════════════════════════════════════════════════════════

  // ── State data ──────────────────────────────────────────────────────────────
  const [data, setData] = useState([]);
  const [pegawaiList, setPegawaiList] = useState([]); // daftar pegawai untuk dropdown

  // ── State filter ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [status, setStatus] = useState("");
  const [bulan, setBulan] = useState(
    new Date()
      .toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
      .slice(0, 7),
  );

  // ── State dialog tambah/edit ─────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [shiftOtomatis, setShiftOtomatis] = useState(null); // jadwal shift dari API
  const [loadingShift, setLoadingShift] = useState(false);

  // ── State upload surat ───────────────────────────────────────────────────────
  const [suratFile, setSuratFile] = useState(null); // file yang dipilih
  const [suratPreview, setSuratPreview] = useState(null); // preview file { type, url/name }

  // ── State dialog hapus ───────────────────────────────────────────────────────
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  // ── State snackbar notifikasi ───────────────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  // ── State pagination ─────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // ════════════════════════════════════════════════════════════
  // FETCH DATA
  // ════════════════════════════════════════════════════════════

  // ── Fetch absensi perbulan — useCallback: fungsi hanya dibuat ulang jika "bulan" berubah ─────────────
  const fetchAbsensi = useCallback(async () => {
    try {
      const res = await api.get(`/absensi?bulan=${bulan}`);
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Gagal fetch absensi:", err);
    }
  }, [bulan]); // ← re-create jika bulan berubah

  // ── Fetch daftar pegawai untuk dropdown di form ─────────────────────
  const fetchPegawai = useCallback(async () => {
    try {
      const res = await api.get("/pegawai");
      setPegawaiList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Gagal fetch pegawai:", err);
    }
  }, []);

  // ── Jalankan fetch saat komponen mount + saat bulan berubah ────────────────
  useEffect(() => {
    fetchAbsensi();
    fetchPegawai();
  }, [fetchAbsensi, fetchPegawai]);

  // ── Reset ke halaman 1 setiap kali filter berubah ────────────────────────────
  useEffect(() => {
    setPage(1);
  }, [search, tanggal, status, bulan]);

  // ── Ambil jadwal shift otomatis saat status Hadir + pegawai + tanggal diisi ──
  useEffect(() => {
    if (
      !form.pegawai_id ||
      !form.tanggal ||
      form.status !== "Hadir" ||
      editId
    ) {
      setShiftOtomatis(null);
      return;
    }
    setLoadingShift(true);
    api
      .get(`/jadwal/pegawai/${form.pegawai_id}?tanggal=${form.tanggal}`)
      .then((res) => setShiftOtomatis(res.data))
      .catch(() => setShiftOtomatis(null))
      .finally(() => setLoadingShift(false));
  }, [form.pegawai_id, form.tanggal, form.status, editId]);

  // ── Filter data ───────────────────────────────────────────────────────────────
  const filteredData = data.filter(
    (item) =>
      item.nama?.toLowerCase().includes(search.toLowerCase()) &&
      (tanggal ? item.tanggal?.includes(tanggal) : true) &&
      (status ? item.status === status : true),
  );

  // ── Pagination ────────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  // ── Hitung Summary cards ─────────────────────────────────────────────────────────────
  const totalHadir = filteredData.filter((d) => d.status === "Hadir").length;
  const totalTerlambat = filteredData.filter(
    (d) => d.status === "Terlambat",
  ).length;
  const totalIzin = filteredData.filter((d) =>
    ["Izin", "Sakit", "Cuti", "Alfa"].includes(d.status),
  ).length;

  // ── Cek apakah cuti berasal dari jadwal (tidak bisa dihapus manual) ──
  // Jika is_from_jadwal=1 → tombol hapus diganti ikon info
  const isCutiDariJadwal = (item) =>
    item.status === "Cuti" && item.is_from_jadwal === 1;

  const resetFileState = () => {
    setSuratFile(null);
    setSuratPreview(null);
  };

  // ── Buka dialog TAMBAH ────────────────────────────────────────
  const handleOpenTambah = () => {
    setEditId(null);
    setForm(emptyForm);
    resetFileState();
    setDialogOpen(true);
  };
  // ── Buka dialog EDIT ──────────────────────────────────────────
  const handleOpenEdit = (item) => {
    setEditId(item.id);
    setForm({
      pegawai_id: item.pegawai_id || "",
      tanggal: item.tanggal || "",
      status: item.status || "Izin",
      keterangan: item.keterangan || "",
      shift_kode: item.shift_kode || "",
    });
    resetFileState();
    setDialogOpen(true);
  };

  // ── Handle pilih file surat ───────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSuratFile(file);
    if (file.type.startsWith("image/")) {
      setSuratPreview({ type: "image", url: URL.createObjectURL(file) });
    } else {
      setSuratPreview({ type: "pdf", name: file.name });
    }
  };

  // ── Simpan absensi (tambah / edit) ───────────────────────────────────────────
  const handleSimpan = async () => {
    // Validasi wajib isi
    if (!form.pegawai_id || !form.tanggal || !form.status) {
      return showSnackbar("Pegawai, tanggal, dan status wajib diisi", "error");
    }

    if (!editId) {
      const today = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
      });

      if (form.tanggal < today) {
        return showSnackbar(
          "Tidak dapat menginput absensi mundur (backdate). Pilih tanggal hari ini.",
          "error",
        );
      }
      if (form.tanggal > today) {
        return showSnackbar(
          "Tidak dapat menginput absensi untuk tanggal yang belum tiba.",
          "error",
        );
      }
    }
    // Validasi jadwal wajib ada jika status Hadir
    if (form.status === "Hadir" && !shiftOtomatis) {
      return showSnackbar(
        "Pegawai tidak memiliki jadwal shift di tanggal ini. Periksa kembali jadwal shift pegawai.",
        "warning",
      );
    }
    setSaving(true);
    try {
      if (editId) {
        // ── MODE EDIT: hanya update status + keterangan ──────────
        await api.put(`/absensi/${editId}`, {
          status: form.status,
          keterangan: form.keterangan,
        });
        showSnackbar("Absensi berhasil diperbarui");
      } else {
        // ── MODE TAMBAH: kirim FormData (karena ada file) ────────
        const formData = new FormData();
        formData.append("pegawai_id", form.pegawai_id);
        formData.append("tanggal", form.tanggal);
        formData.append("status", form.status);
        formData.append("shift_kode", shiftOtomatis?.shift_kode || "");

        // Tambahkan keterangan manual admin untuk status Hadir
        const keteranganFinal =
          form.status === "Hadir"
            ? `Diabsensi manual oleh admin${form.keterangan ? ` · ${form.keterangan}` : ""}`
            : form.keterangan;
        formData.append("keterangan", keteranganFinal);

        if (suratFile) formData.append("surat_mc", suratFile);
        await api.post("/absensi/manual", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSnackbar(`Absensi ${form.status} berhasil ditambahkan`);
      }
      setDialogOpen(false);
      resetFileState();
      fetchAbsensi();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Gagal menyimpan absensi",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Hapus absensi ─────────────────────────────────────────────────────────────
  const handleHapus = async () => {
    try {
      await api.delete(`/absensi/${deleteDialog.item.id}`);
      showSnackbar("Absensi berhasil dihapus");
      setDeleteDialog({ open: false, item: null });
      fetchAbsensi();
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Gagal menghapus", "error");
    }
  };

  // ── Bottom sheet props untuk dialog di mobile ────────────────────────────────
  const bottomSheetProps = {
    PaperProps: {
      sx: {
        borderRadius: isSmall ? "20px 20px 0 0" : 3,
        minWidth: isSmall ? "100%" : undefined,
        width: isSmall ? "100%" : undefined,
        margin: 0,
        position: isSmall ? "fixed" : "relative",
        bottom: isSmall ? 0 : "auto",
      },
    },
    sx: {
      "& .MuiDialog-container": { alignItems: isSmall ? "flex-end" : "center" },
    },
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayoutAdmin>
      <Box sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
        {/* ── HEADER ── */}
        <Box mb={3}>
          <Typography variant="h5" fontWeight="bold">
            Data Absensi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Riwayat absensi seluruh pegawai
          </Typography>
        </Box>

        {/* ── SUMMARY CARDS ── */}
        <Grid container spacing={1.5} mb={2.5}>
          {[
            {
              label: "Tepat Waktu",
              value: totalHadir,
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
              label: "Izin/Sakit/Cuti",
              value: totalIzin,
              color: "info.main",
              bg: "#e3f2fd",
            },
            {
              label: "Total Absensi",
              value: filteredData.length,
              color: "text.primary",
              bg: "#f5f5f5",
            },
          ].map((s) => (
            <Grid key={s.label} size={{ xs: 3 }}>
              <Paper
                sx={{
                  p: { xs: 1, sm: 2 },
                  borderRadius: 3,
                  backgroundColor: s.bg,
                  height: "100%",
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color={s.color}
                  fontSize={{ xs: 10, sm: 14 }}
                >
                  {s.label}
                </Typography>
                <Typography
                  variant="h5"
                  color={s.color}
                  fontWeight="bold"
                  my={0.5}
                  fontSize={{ xs: 18, sm: 24 }}
                >
                  {s.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* ── FILTER ── */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Cari Nama Pegawai"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="">Semua Status</MenuItem>
                <MenuItem value="Hadir">Hadir</MenuItem>
                <MenuItem value="Terlambat">Terlambat</MenuItem>
                <MenuItem value="Izin">Izin</MenuItem>
                <MenuItem value="Sakit">Sakit</MenuItem>
                <MenuItem value="Cuti">Cuti</MenuItem>
                <MenuItem value="Alfa">Alfa</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, md: 1.5 }}>
              <TextField
                type="date"
                fullWidth
                size="small"
                label="Tanggal"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 1.5 }}>
              <TextField
                type="month"
                fullWidth
                size="small"
                label="Bulan"
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 1.5 }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                sx={{ height: 40 }}
                onClick={() => {
                  setSearch("");
                  setTanggal("");
                  setStatus("");
                  setBulan(
                    new Date()
                      .toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
                      .slice(0, 7),
                  );
                }}
              >
                Reset
              </Button>
            </Grid>
            <Grid size={{ xs: 6, md: 2.5 }}>
              <Button
                fullWidth
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleOpenTambah}
                sx={{ height: 40, whiteSpace: "nowrap" }}
              >
                {isMobile ? "Tambah" : "Tambah Absensi"}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* ── KONTEN: mobile card / desktop tabel ── */}
        {isMobile ? (
          <Box>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <AbsensiCard
                  key={item.id}
                  item={item}
                  index={(page - 1) * rowsPerPage + index}
                  onEdit={handleOpenEdit}
                  onDelete={(item) => setDeleteDialog({ open: true, item })}
                  isCutiDariJadwal={isCutiDariJadwal}
                />
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
          <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Box
              sx={{
                width: "100%",
                overflowX: "auto",
                p: 2,
                boxSizing: "border-box",
              }}
            >
              <Table
                sx={{
                  width: "100%",
                  tableLayout: "auto",
                  "& .MuiTableCell-root": {
                    fontWeight: 400,
                    fontSize: 13,
                    borderBottom: "1px solid #f0f0f0",
                    py: 1.2,
                    px: 1.5,
                    whiteSpace: "nowrap",
                  },
                  "& .MuiTableHead-root .MuiTableCell-root": {
                    fontWeight: 500,
                    fontSize: 13,
                    backgroundColor: "#fafafa",
                    color: "#333",
                    py: 1.5,
                  },
                  "& .MuiChip-root": { height: 24, fontSize: 12 },
                  "& .MuiIconButton-root": { padding: "4px" },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 30 }}>No</TableCell>
                    <TableCell sx={{ width: 120 }}>Nama</TableCell>
                    <TableCell sx={{ width: 170 }}>Tanggal</TableCell>
                    <TableCell sx={{ width: 70 }}>Jadwal</TableCell>
                    <TableCell sx={{ width: 100 }}>Jam Masuk</TableCell>
                    <TableCell sx={{ width: 90 }}>Area Masuk</TableCell>
                    <TableCell sx={{ width: 100 }}>Jam Pulang</TableCell>
                    <TableCell sx={{ width: 90 }}>Area Pulang</TableCell>
                    <TableCell sx={{ width: 90 }}>Koordinat</TableCell>
                    <TableCell sx={{ width: 120 }}>Keterangan</TableCell>
                    <TableCell sx={{ width: 100 }}>Status</TableCell>
                    <TableCell sx={{ width: 90 }} align="center">
                      Aksi
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item, index) => (
                      <TableRow
                        key={item.id}
                        sx={{ "&:hover": { backgroundColor: "#fafafa" } }}
                      >
                        {/* No urut global */}
                        <TableCell>
                          {(page - 1) * rowsPerPage + index + 1}
                        </TableCell>

                        {/* Nama + badge manual admin + warning suspicious */}
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Box>
                              <Typography fontWeight="bold" fontSize={12}>
                                {item.nama}
                              </Typography>
                              {item.keterangan?.includes(
                                "Diabsensi manual oleh admin",
                              ) && (
                                <Typography fontSize={10} color="#1565c0">
                                  📋 Manual oleh admin
                                </Typography>
                              )}
                            </Box>
                            {item.is_suspicious === 1 && (
                              <Tooltip
                                title={`Lokasi mencurigakan — akurasi ±${item.accuracy}m`}
                              >
                                <WarningAmberIcon
                                  sx={{ fontSize: 15, color: "#f57c00" }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        <TableCell>{formatTanggal(item.tanggal)}</TableCell>
                        <TableCell>{item.shift_kode || "-"}</TableCell>

                        {/* Jam masuk */}
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

                        {/* Area masuk */}
                        <TableCell>
                          {item.jam_masuk ? (
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
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        {/* Jam pulang */}
                        <TableCell>
                          {item.jam_pulang ? (
                            <Chip label={item.jam_pulang} size="small" />
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        {/* Area pulang */}
                        <TableCell>
                          {item.jam_pulang ? (
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
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        {/* Koordinat GPS */}
                        <TableCell>
                          {item.latitude && item.longitude ? (
                            <Tooltip
                              title={`Lat: ${Number(item.latitude).toFixed(6)}, Lng: ${Number(item.longitude).toFixed(6)} | Jarak: ${item.distance ? Math.round(item.distance) + " m" : "-"}`}
                            >
                              <IconButton
                                size="small"
                                onClick={() =>
                                  window.open(
                                    `https://www.google.com/maps?q=${item.latitude},${item.longitude}`,
                                    "_blank",
                                  )
                                }
                                sx={{
                                  color:
                                    item.status_area === "DALAM"
                                      ? "#2e7d32"
                                      : "#c62828",
                                }}
                              >
                                <LocationOnIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        {/* Keterangan + lampiran surat */}
                        <TableCell
                          sx={{
                            fontSize: 13,
                            color: "text.secondary",
                            minWidth: 150,
                            whiteSpace: "normal !important",
                          }}
                        >
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={0.5}
                            flexWrap="wrap"
                          >
                            <span>
                              {item.keterangan || item.keterangan_pulang || "-"}
                            </span>
                            {item.surat_mc && (
                              <Tooltip title="Lihat Surat MC">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    window.open(
                                      `http://localhost:5000/uploads/surat_mc/${item.surat_mc}`,
                                      "_blank",
                                    )
                                  }
                                  sx={{ color: "#1565c0" }}
                                >
                                  <AttachFileIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            {item.surat_cuti && (
                              <Tooltip title="Lihat Surat Cuti">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    window.open(
                                      `http://localhost:5000/uploads/surat_cuti/${item.surat_cuti}`,
                                      "_blank",
                                    )
                                  }
                                  sx={{ color: "#1565c0" }}
                                >
                                  <AttachFileIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        {/* Status chip */}
                        <TableCell>
                          <Chip
                            label={item.status}
                            color={getStatusColor(item.status)}
                            size="small"
                          />
                        </TableCell>

                        {/* Aksi: edit + hapus */}
                        <TableCell align="center">
                          <Box display="flex" gap={0.5} justifyContent="center">
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEdit(item)}
                                sx={{ color: "#1565c0" }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {isCutiDariJadwal(item) ? (
                              <Tooltip title="Untuk membatalkan cuti, ubah jadwal shift di halaman Jadwal Shift">
                                <IconButton size="small" sx={{ color: "#bbb" }}>
                                  <InfoOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Hapus">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setDeleteDialog({ open: true, item })
                                  }
                                  sx={{ color: "#c62828" }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={12}
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

        {/* ── PAGINATION ── */}
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
            {/* Kiri: pilih jumlah per halaman */}
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
                {[10, 25, 50, 100].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </TextField>
              <Typography fontSize={13} color="text.secondary">
                dari <strong>{filteredData.length}</strong> data
              </Typography>
            </Box>

            {/* Kanan: info halaman + navigasi */}
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

        {/* ── DIALOG TAMBAH / EDIT ── */}
        <Dialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            resetFileState();
          }}
          maxWidth="sm"
          fullWidth
          fullScreen={false}
          {...bottomSheetProps}
        >
          <DialogTitle fontWeight="bold">
            {editId ? "Edit Absensi" : "Tambah Absensi"}
          </DialogTitle>
          <Divider />
          <DialogContent dividers>
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              {/* Pilih pegawai (tambah) / tampil nama (edit) */}
              {!editId ? (
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Pegawai *"
                  value={form.pegawai_id}
                  onChange={(e) =>
                    setForm({ ...form, pegawai_id: e.target.value })
                  }
                >
                  <MenuItem value="">
                    <em>Pilih pegawai</em>
                  </MenuItem>
                  {pegawaiList.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.nama}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  fullWidth
                  size="small"
                  label="Pegawai"
                  disabled
                  value={
                    pegawaiList.find((p) => p.id === form.pegawai_id)?.nama ||
                    ""
                  }
                />
              )}

              {/* Tanggal (hanya saat tambah) */}
              {!editId && (
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  label="Tanggal *"
                  value={form.tanggal}
                  onChange={(e) =>
                    setForm({ ...form, tanggal: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  // ✅ min dan max sama = hanya bisa pilih hari ini
                  inputProps={{
                    min: new Date().toLocaleDateString("en-CA", {
                      timeZone: "Asia/Jakarta",
                    }),
                    max: new Date().toLocaleDateString("en-CA", {
                      timeZone: "Asia/Jakarta",
                    }),
                  }}
                  helperText="Absensi manual hanya dapat diinput untuk hari ini"
                />
              )}

              {/* Dropdown status */}
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value, shift_kode: "" })
                }
                disabled={!!editId}
              >
                {!editId && <MenuItem value="Hadir">Hadir</MenuItem>}
                <MenuItem value="Izin">Izin</MenuItem>
                <MenuItem value="Sakit">Sakit</MenuItem>
                {editId && (
                  <MenuItem value={form.status}>{form.status}</MenuItem>
                )}
              </TextField>

              {/* Info Cuti dari jadwal */}
              {editId && form.status === "Cuti" && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: "#fff8e1",
                    border: "1px solid #ffe082",
                  }}
                >
                  <Typography fontSize={12} color="#f57f17">
                    Status Cuti dikelola melalui halaman{" "}
                    <strong>Jadwal Shift</strong>. Kamu hanya bisa mengubah
                    keterangan.
                  </Typography>
                </Box>
              )}

              {/* Info status tidak dapat diubah saat edit */}
              {editId && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: "#f5f5f5",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Typography fontSize={12} color="text.secondary">
                    Status tidak dapat diubah. Hanya keterangan yang dapat
                    diperbarui.
                  </Typography>
                </Box>
              )}

              {/* Info jadwal shift otomatis (status Hadir + tambah) */}
              {form.status === "Hadir" && !editId && (
                <Box>
                  {loadingShift ? (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: "#f5f5f5",
                      }}
                    >
                      <Typography fontSize={12} color="text.secondary">
                        🔄 Mengambil jadwal shift...
                      </Typography>
                    </Box>
                  ) : shiftOtomatis ? (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: "#e8f5e9",
                        border: "1px solid #a5d6a7",
                      }}
                    >
                      <Typography
                        fontSize={12}
                        fontWeight="bold"
                        color="#2e7d32"
                        mb={0.5}
                      >
                        ✅ Jadwal shift ditemukan
                      </Typography>
                      <Typography fontSize={12} color="#2e7d32">
                        Shift <strong>{shiftOtomatis.shift_kode}</strong> —{" "}
                        {shiftOtomatis.nama}
                      </Typography>
                      <Typography fontSize={11} color="#2e7d32">
                        {shiftOtomatis.jam_masuk?.slice(0, 5)} –{" "}
                        {shiftOtomatis.jam_pulang?.slice(0, 5)} WIB
                      </Typography>
                    </Box>
                  ) : form.pegawai_id && form.tanggal ? (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: "#fff3e0",
                        border: "1px solid #ffcc02",
                      }}
                    >
                      <Typography fontSize={12} color="#e65100">
                        ⚠️ Pegawai tidak memiliki jadwal shift di tanggal ini.
                        Periksa halaman Jadwal Shift.
                      </Typography>
                    </Box>
                  ) : null}

                  {shiftOtomatis && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: "#e3f2fd",
                        border: "1px solid #90caf9",
                      }}
                    >
                      <Typography fontSize={12} color="#1565c0">
                        ℹ️ Pegawai akan melihat notifikasi bahwa absensi telah
                        dilakukan manual oleh admin.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Keterangan */}
              <TextField
                fullWidth
                size="small"
                label="Keterangan"
                multiline
                rows={2}
                placeholder={
                  form.status === "Hadir"
                    ? "Contoh: Jaringan internet bermasalah"
                    : form.status === "Sakit"
                      ? "Contoh: Demam, ada surat MC"
                      : "Contoh: Keperluan keluarga"
                }
                value={form.keterangan}
                onChange={(e) =>
                  setForm({ ...form, keterangan: e.target.value })
                }
              />

              {/* Upload surat MC (hanya status Sakit + tambah) */}
              {form.status === "Sakit" && !editId && (
                <>
                  <Divider />
                  <Box>
                    <Typography fontSize={14} fontWeight="bold" mb={1}>
                      Surat Keterangan Sakit / Bukti Sakit
                    </Typography>
                    {!suratPreview ? (
                      <Button
                        component="label"
                        variant="outlined"
                        fullWidth
                        sx={{
                          borderStyle: "dashed",
                          py: 2,
                          color: "#1565c0",
                          borderColor: "#90caf9",
                          "&:hover": {
                            borderColor: "#1565c0",
                            backgroundColor: "#e3f2fd",
                          },
                        }}
                      >
                        Klik untuk unggah bukti sakit (JPG/PNG/PDF)
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          hidden
                          onChange={handleFileChange}
                        />
                      </Button>
                    ) : (
                      <Box
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 2,
                          p: 1.5,
                        }}
                      >
                        {suratPreview.type === "image" ? (
                          <img
                            src={suratPreview.url}
                            alt="preview"
                            style={{
                              width: "100%",
                              maxHeight: 200,
                              objectFit: "contain",
                              borderRadius: 8,
                            }}
                          />
                        ) : (
                          <Box display="flex" alignItems="center" gap={1}>
                            <AttachFileIcon sx={{ color: "#1565c0" }} />
                            <Typography fontSize={13}>
                              {suratPreview.name}
                            </Typography>
                          </Box>
                        )}
                        <Button
                          size="small"
                          color="error"
                          sx={{ mt: 1 }}
                          onClick={() => {
                            setSuratFile(null);
                            setSuratPreview(null);
                          }}
                        >
                          Hapus File
                        </Button>
                      </Box>
                    )}
                    <Typography fontSize={11} color="text.secondary" mt={0.5}>
                      Opsional, namun sangat disarankan sebagai bukti pendukung
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => {
                setDialogOpen(false);
                resetFileState();
              }}
              variant="outlined"
              sx={{ flex: 1, borderRadius: 2 }}
            >
              Batal
            </Button>
            <Button
              variant="contained"
              onClick={handleSimpan}
              disabled={saving}
              sx={{ flex: 1, borderRadius: 2 }}
            >
              {saving ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Tambah"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── DIALOG HAPUS ── */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, item: null })}
          maxWidth="xs"
          fullWidth
          fullScreen={false}
          {...bottomSheetProps}
        >
          <DialogTitle fontWeight="bold">Hapus Absensi</DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 2 }}>
            <Typography>
              Hapus absensi <strong>{deleteDialog.item?.nama}</strong> pada{" "}
              <strong>
                {deleteDialog.item
                  ? formatTanggal(deleteDialog.item.tanggal)
                  : ""}
              </strong>
              ?
            </Typography>
            <Typography variant="body2" color="error" mt={1}>
              Tindakan ini tidak bisa dibatalkan.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setDeleteDialog({ open: false, item: null })}
              variant="outlined"
              sx={{ flex: 1, borderRadius: 2 }}
            >
              Batal
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleHapus}
              sx={{ flex: 1, borderRadius: 2 }}
            >
              Hapus
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── SNACKBAR ── */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3500}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={snackbar.severity} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </DashboardLayoutAdmin>
  );
}
