import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocationOnIcon from "@mui/icons-material/LocationOn";

// ─── Konstanta ────────────────────────────────────────────────────────────────
const API = "http://localhost:5000/api";

const emptyForm = {
  pegawai_id: "",
  tanggal: "",
  status: "Izin",
  keterangan: "",
};

// ─── Helper: warna chip status ────────────────────────────────────────────────
const getStatusColor = (s) => {
  if (s === "Hadir") return "success";
  if (s === "Terlambat") return "warning";
  if (s === "Izin") return "info";
  if (s === "Sakit") return "error";
  if (s === "Cuti") return "secondary";
  return "default";
};

// ─── Helper: format tanggal ke bahasa Indonesia ───────────────────────────────
const formatTanggal = (tgl) =>
  new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// ═════════════════════════════════════════════════════════════════════════════
export default function DataAbsensi() {
  // ── State data ──────────────────────────────────────────────────────────────
  const [data, setData] = useState([]);
  const [pegawaiList, setPegawaiList] = useState([]);

  // ── State filter ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [status, setStatus] = useState("");

  // ── State dialog tambah/edit ─────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // ── State upload surat ───────────────────────────────────────────────────────
  const [suratFile, setSuratFile] = useState(null);
  const [suratPreview, setSuratPreview] = useState(null);

  // ── State dialog hapus ───────────────────────────────────────────────────────
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  // ── State snackbar notifikasi ────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  // ── Fetch: semua data absensi ────────────────────────────────────────────────
  const fetchAbsensi = async () => {
    try {
      const res = await api.get("/absensi");
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Gagal fetch absensi:", err);
    }
  };

  // ── Fetch: daftar pegawai untuk dropdown ─────────────────────────────────────
  const fetchPegawai = async () => {
    try {
      const res = await api.get("/pegawai");
      setPegawaiList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Gagal fetch pegawai:", err);
    }
  };

  useEffect(() => {
    fetchAbsensi();
    fetchPegawai();
  }, []);

  // ── Filter data berdasarkan search, tanggal, status ──────────────────────────
  const filteredData = data.filter(
    (item) =>
      item.nama?.toLowerCase().includes(search.toLowerCase()) &&
      (tanggal ? item.tanggal?.includes(tanggal) : true) &&
      (status ? item.status === status : true),
  );

  // ── Hitung summary dari data yang sudah difilter ─────────────────────────────
  const totalHadir = filteredData.filter((d) => d.status === "Hadir").length;
  const totalTerlambat = filteredData.filter(
    (d) => d.status === "Terlambat",
  ).length;
  const totalIzin = filteredData.filter((d) =>
    ["Izin", "Sakit", "Cuti", "Alpha"].includes(d.status),
  ).length;

  // ── Cuti yang berasal dari jadwal shift (tidak bisa dihapus manual) ───────────
  const isCutiDariJadwal = (item) =>
    item.status === "Cuti" && item.is_from_jadwal === 1;

  // ── Reset state file surat ───────────────────────────────────────────────────
  const resetFileState = () => {
    setSuratFile(null);
    setSuratPreview(null);
  };

  // ── Buka dialog tambah absensi manual ────────────────────────────────────────
  const handleOpenTambah = () => {
    setEditId(null);
    setForm(emptyForm);
    resetFileState();
    setDialogOpen(true);
  };

  // ── Buka dialog edit absensi ──────────────────────────────────────────────────
  const handleOpenEdit = (item) => {
    setEditId(item.id);
    setForm({
      pegawai_id: item.pegawai_id || "",
      tanggal: item.tanggal || "",
      status: item.status || "Izin",
      keterangan: item.keterangan || "",
    });
    resetFileState();
    setDialogOpen(true);
  };

  // ── Handle upload file surat MC ───────────────────────────────────────────────
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

  // ── Simpan absensi (tambah / edit) ────────────────────────────────────────────
  const handleSimpan = async () => {
    if (!form.pegawai_id || !form.tanggal || !form.status) {
      return showSnackbar("Pegawai, tanggal, dan status wajib diisi", "error");
    }
    setSaving(true);
    try {
      if (editId) {
        // Mode edit — hanya update status & keterangan
        await api.put(`/absensi/${editId}`, {
          status: form.status,
          keterangan: form.keterangan,
        });
        showSnackbar("✅ Absensi berhasil diperbarui");
      } else {
        // Mode tambah manual — kirim FormData (mendukung upload surat MC)
        const formData = new FormData();
        formData.append("pegawai_id", form.pegawai_id);
        formData.append("tanggal", form.tanggal);
        formData.append("status", form.status);
        formData.append("keterangan", form.keterangan);
        if (suratFile) formData.append("surat_mc", suratFile);

        await api.post("/absensi/manual", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSnackbar(`✅ Absensi ${form.status} berhasil ditambahkan`);
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
      showSnackbar("✅ Absensi berhasil dihapus");
      setDeleteDialog({ open: false, item: null });
      fetchAbsensi();
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Gagal menghapus", "error");
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayoutAdmin>
      <Box>
        {/* ── HEADER ── */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Data Absensi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rekap harian kehadiran seluruh pegawai
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenTambah}
            sx={{ borderRadius: 2 }}
          >
            Tambah Absensi
          </Button>
        </Box>

        {/* ── SUMMARY CARDS ── */}
        <Box display="flex" gap={2} flexWrap="wrap" mb={3}>
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
              label: "Total Data",
              value: filteredData.length,
              color: "text.primary",
              bg: "#f5f5f5",
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
                color={s.color}
                fontWeight="bold"
                my={0.5}
              >
                {s.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* ── FILTER ── */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Cari nama */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Cari Nama Pegawai"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>
            {/* Filter status */}
            <Grid size={{ xs: 12, md: 3 }}>
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
                <MenuItem value="Alpha">Alpha</MenuItem>
              </TextField>
            </Grid>
            {/* Filter tanggal */}
            <Grid size={{ xs: 12, md: 3 }}>
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
            {/* Tombol reset filter */}
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                sx={{ height: 40 }}
                onClick={() => {
                  setSearch("");
                  setTanggal("");
                  setStatus("");
                }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* ── TABEL DATA ABSENSI ── */}
        <Paper sx={{ p: 2, borderRadius: 3, overflow: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Nama</TableCell>
                <TableCell>Tanggal</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>Jam Masuk</TableCell>
                <TableCell>Area Masuk</TableCell>
                <TableCell>Jam Pulang</TableCell>
                <TableCell>Area Pulang</TableCell>
                <TableCell>Koordinat</TableCell>
                <TableCell>Keterangan</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Aksi</TableCell>
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

                    {/* Nama pegawai */}
                    <TableCell
                      sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}
                    >
                      {item.nama}
                    </TableCell>

                    {/* Tanggal */}
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatTanggal(item.tanggal)}
                    </TableCell>

                    {/* Kode shift */}
                    <TableCell>{item.shift_kode || "-"}</TableCell>

                    {/* Jam masuk — kuning kalau terlambat */}
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

                    {/* Area masuk — DALAM/LUAR */}
                    <TableCell>
                      {item.jam_masuk ? (
                        <Chip
                          label={item.status_area || "-"}
                          color={
                            item.status_area === "DALAM" ? "success" : "warning"
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

                    {/* Area pulang — DALAM/LUAR */}
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

                    {/* Koordinat GPS — khusus admin, buka Google Maps saat diklik */}
                    <TableCell>
                      {item.latitude && item.longitude ? (
                        <Tooltip
                          title={
                            `Lat: ${Number(item.latitude).toFixed(6)}, ` +
                            `Lng: ${Number(item.longitude).toFixed(6)} | ` +
                            `Jarak: ${item.distance ? Math.round(item.distance) + " m" : "-"}`
                          }
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
                              // Hijau = DALAM area, merah = LUAR area (potensi kecurangan)
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
                        <Typography fontSize={13} color="text.disabled">
                          -
                        </Typography>
                      )}
                    </TableCell>

                    {/* Keterangan + icon lampiran surat MC / surat cuti */}
                    <TableCell
                      sx={{
                        fontSize: 13,
                        color: "text.secondary",
                        minWidth: 160,
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

                        {/* Icon lampiran surat MC (Sakit) */}
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

                        {/* Icon lampiran surat cuti */}
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

                    {/* Chip status */}
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status)}
                        size="small"
                      />
                    </TableCell>

                    {/* Aksi: edit + hapus (atau info jika cuti dari jadwal) */}
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
                          // Cuti dari jadwal shift — tidak bisa dihapus manual
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
        </Paper>
      </Box>

      {/* ════════ DIALOG TAMBAH / EDIT ════════ */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          resetFileState();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight="bold">
          {editId ? "Edit Absensi" : "Tambah Absensi Manual"}
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            {/* Dropdown pegawai (hanya saat tambah) / tampil nama saat edit */}
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
                  pegawaiList.find((p) => p.id === form.pegawai_id)?.nama || ""
                }
              />
            )}

            {/* Tanggal hanya saat tambah */}
            {!editId && (
              <TextField
                type="date"
                fullWidth
                size="small"
                label="Tanggal *"
                value={form.tanggal}
                onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            )}

            {/* Dropdown status — hanya Izin & Sakit (Cuti dikelola dari Jadwal Shift) */}
            <TextField
              select
              fullWidth
              size="small"
              label="Status *"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              disabled={!!(editId && form.status === "Cuti")}
            >
              <MenuItem value="Izin">Izin</MenuItem>
              <MenuItem value="Sakit">Sakit</MenuItem>
              {editId && form.status === "Cuti" && (
                <MenuItem value="Cuti">Cuti</MenuItem>
              )}
            </TextField>

            {/* Peringatan jika edit status Cuti */}
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
                  ℹ️ Status Cuti dikelola melalui halaman{" "}
                  <strong>Jadwal Shift</strong>. Kamu hanya bisa mengubah
                  keterangan.
                </Typography>
              </Box>
            )}

            {/* Input keterangan */}
            <TextField
              fullWidth
              size="small"
              label="Keterangan"
              multiline
              rows={2}
              placeholder={
                form.status === "Sakit"
                  ? "Contoh: Demam, ada surat MC"
                  : "Contoh: Keperluan keluarga"
              }
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
            />

            {/* Upload surat MC — hanya saat tambah dengan status Sakit */}
            {form.status === "Sakit" && !editId && (
              <>
                <Divider />
                <Box>
                  <Typography fontSize={14} fontWeight="bold" mb={1}>
                    📎 Surat MC / Bukti Sakit
                  </Typography>

                  {!suratPreview ? (
                    // Tombol upload
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
                      📁 Klik untuk upload surat MC (JPG/PNG/PDF)
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        hidden
                        onChange={handleFileChange}
                      />
                    </Button>
                  ) : (
                    // Preview file yang dipilih
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
                    * Opsional, namun sangat disarankan sebagai bukti
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogOpen(false);
              resetFileState();
            }}
          >
            Batal
          </Button>
          <Button variant="contained" onClick={handleSimpan} disabled={saving}>
            {saving ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Tambah"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════ DIALOG KONFIRMASI HAPUS ════════ */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, item: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight="bold">Hapus Absensi</DialogTitle>
        <DialogContent>
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
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>
            Batal
          </Button>
          <Button variant="contained" color="error" onClick={handleHapus}>
            Hapus
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════ SNACKBAR NOTIFIKASI ════════ */}
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
    </DashboardLayoutAdmin>
  );
}
