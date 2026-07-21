import { useState, useEffect, useCallback } from "react";
import { api } from "../../utils/api";
import DashboardLayoutPegawai from "../../layout/DashboardLayoutPegawai";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Snackbar,
  Alert,
  Tooltip,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingIcon from "@mui/icons-material/Pending";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTgl = (tgl) =>
  new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const hitungHari = (mulai, selesai) =>
  Math.max(
    1,
    Math.round(
      (new Date(selesai + "T00:00:00") - new Date(mulai + "T00:00:00")) /
        86400000,
    ) + 1,
  );

const getStatusChip = (status) => {
  if (status === "Disetujui")
    return (
      <Chip
        icon={<CheckCircleIcon />}
        label="Disetujui"
        color="success"
        size="small"
        sx={{ fontWeight: "bold" }}
      />
    );
  if (status === "Ditolak")
    return (
      <Chip
        icon={<CancelIcon />}
        label="Ditolak"
        color="error"
        size="small"
        sx={{ fontWeight: "bold" }}
      />
    );
  return (
    <Chip
      icon={<PendingIcon />}
      label="Menunggu Persetujuan"
      color="warning"
      size="small"
      sx={{ fontWeight: "bold" }}
    />
  );
};

// ═════════════════════════════════════════════════════════════════════════════
export default function PengajuanCuti() {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();
  const pegawaiId = user?.pegawai_id;

  // ── State data ──────────────────────────────────────────────────────────────
  const [list, setList] = useState([]);
  const [jatahCuti, setJatahCuti] = useState(null);

  // ── State dialog ajukan ──────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suratFile, setSuratFile] = useState(null);
  const [suratPreview, setSuratPreview] = useState(null);
  const [form, setForm] = useState({
    tanggal_mulai: "",
    tanggal_selesai: "",
    alasan: "",
  });

  // ── State dialog detail ──────────────────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  // ── State dialog batal ───────────────────────────────────────────────────────
  const [batalOpen, setBatalOpen] = useState(false);
  const [batalItem, setBatalItem] = useState(null);

  // ── Snackbar ─────────────────────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  // ── Fetch riwayat pengajuan + jatah cuti ──────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!pegawaiId) return;
    try {
      const [resList, resJatah] = await Promise.all([
        api.get(`/pengajuan-cuti?pegawai_id=${pegawaiId}`),
        api.get(`/cuti/jatah?pegawai_id=${pegawaiId}`),
      ]);
      setList(Array.isArray(resList.data) ? resList.data : []);
      setJatahCuti(resJatah.data || null);
    } catch (err) {
      console.error("Gagal fetch pengajuan cuti:", err);
    }
  }, [pegawaiId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Kalkulasi ─────────────────────────────────────────────────────────────
  const jumlahHari =
    form.tanggal_mulai && form.tanggal_selesai
      ? hitungHari(form.tanggal_mulai, form.tanggal_selesai)
      : 0;

  const sisaCuti = jatahCuti
    ? (jatahCuti.jatah || 0) - (jatahCuti.terpakai || 0)
    : null;

  // ── Handle file ───────────────────────────────────────────────────────────
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

  const resetForm = () => {
    setForm({ tanggal_mulai: "", tanggal_selesai: "", alasan: "" });
    setSuratFile(null);
    setSuratPreview(null);
  };

  // ── Submit pengajuan ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.tanggal_mulai || !form.tanggal_selesai || !form.alasan.trim())
      return showSnackbar(
        "Tanggal mulai, selesai, dan alasan wajib diisi",
        "error",
      );
    if (form.tanggal_selesai < form.tanggal_mulai)
      return showSnackbar(
        "Tanggal selesai tidak boleh sebelum tanggal mulai",
        "error",
      );
    if (sisaCuti !== null && jumlahHari > sisaCuti)
      return showSnackbar(
        `Sisa jatah cuti kamu hanya ${sisaCuti} hari, pengajuan ini membutuhkan ${jumlahHari} hari`,
        "error",
      );

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("pegawai_id", pegawaiId);
      formData.append("tanggal_mulai", form.tanggal_mulai);
      formData.append("tanggal_selesai", form.tanggal_selesai);
      formData.append("alasan", form.alasan);
      if (suratFile) formData.append("surat_cuti", suratFile);

      await api.post("/pengajuan-cuti", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showSnackbar("✅ Pengajuan cuti berhasil dikirim");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Gagal mengirim pengajuan",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Batalkan pengajuan ────────────────────────────────────────────────────
  const handleBatal = async () => {
    if (!batalItem) return;
    try {
      await api.delete(`/pengajuan-cuti/${batalItem.id}`);
      showSnackbar("Pengajuan cuti berhasil dibatalkan");
      setBatalOpen(false);
      setBatalItem(null);
      fetchData();
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Gagal membatalkan", "error");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayoutPegawai>
      <Box>
        {/* ── HEADER ── */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Pengajuan Cuti
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ajukan cuti dan pantau status persetujuannya
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Ajukan Cuti
          </Button>
        </Box>

        {/* ── INFO JATAH CUTI ── */}
        {jatahCuti && (
          <Box display="flex" gap={2} flexWrap="wrap" mb={3}>
            {[
              {
                label: "Jatah Cuti",
                value: jatahCuti.jatah || 0,
                color: "#1565c0",
                bg: "#e3f2fd",
              },
              {
                label: "Terpakai",
                value: jatahCuti.terpakai || 0,
                color: "#c62828",
                bg: "#ffebee",
              },
              {
                label: "Sisa Cuti",
                value: sisaCuti,
                color: sisaCuti > 0 ? "#2e7d32" : "#c62828",
                bg: sisaCuti > 0 ? "#e8f5e9" : "#ffebee",
              },
            ].map((s) => (
              <Paper
                key={s.label}
                sx={{
                  px: 3,
                  py: 2,
                  borderRadius: 3,
                  backgroundColor: s.bg,
                  flex: 1,
                  minWidth: 120,
                }}
              >
                <Typography fontSize={26} fontWeight="bold" color={s.color}>
                  {s.value}
                </Typography>
                <Typography fontSize={12} color={s.color}>
                  {s.label}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}

        {/* ── RIWAYAT PENGAJUAN ── */}
        {list.length === 0 ? (
          <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
            <Typography color="text.secondary">
              Belum ada pengajuan cuti. Klik "Ajukan Cuti" untuk mengajukan.
            </Typography>
          </Paper>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {list.map((item) => (
              <Card
                key={item.id}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor:
                    item.status === "Disetujui"
                      ? "#a5d6a7"
                      : item.status === "Ditolak"
                        ? "#ef9a9a"
                        : "#ffe082",
                  "&:hover": { boxShadow: 2 },
                  cursor: "pointer",
                }}
                onClick={() => {
                  setDetailItem(item);
                  setDetailOpen(true);
                }}
              >
                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    flexWrap="wrap"
                    gap={1}
                  >
                    {/* Kiri: tanggal & alasan */}
                    <Box flex={1} minWidth={0}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <EventIcon sx={{ fontSize: 16, color: "#1565c0" }} />
                        <Typography fontWeight="bold" fontSize={14}>
                          {fmtTgl(item.tanggal_mulai)}
                          {item.tanggal_mulai !== item.tanggal_selesai &&
                            ` – ${fmtTgl(item.tanggal_selesai)}`}
                        </Typography>
                        <Chip
                          label={`${hitungHari(item.tanggal_mulai, item.tanggal_selesai)} hari`}
                          size="small"
                          sx={{ fontSize: 11, height: 20 }}
                        />
                      </Box>
                      <Typography
                        fontSize={13}
                        color="text.secondary"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.alasan}
                      </Typography>
                      {/* Catatan admin jika ditolak */}
                      {item.catatan_admin && item.status === "Ditolak" && (
                        <Typography fontSize={12} color="#c62828" mt={0.5}>
                          Catatan admin: {item.catatan_admin}
                        </Typography>
                      )}
                    </Box>

                    {/* Kanan: status + waktu diajukan */}
                    <Box textAlign="right" flexShrink={0}>
                      {getStatusChip(item.status)}
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        mt={0.5}
                        justifyContent="flex-end"
                      >
                        <AccessTimeIcon
                          sx={{ fontSize: 12, color: "text.disabled" }}
                        />
                        <Typography fontSize={11} color="text.disabled">
                          {fmtTgl(
                            item.created_at?.slice(0, 10) || item.tanggal_mulai,
                          )}
                        </Typography>
                      </Box>
                      {item.surat_cuti && (
                        <Tooltip title="Ada lampiran surat">
                          <AttachFileIcon
                            sx={{ fontSize: 14, color: "#1565c0", mt: 0.5 }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  {/* Tombol Batalkan — hanya jika masih Menunggu */}
                  {item.status === "Menunggu" && (
                    <Box display="flex" justifyContent="flex-end" mt={1.5}>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation(); // agar tidak buka dialog detail
                          setBatalItem(item);
                          setBatalOpen(true);
                        }}
                        sx={{ fontSize: 11, py: 0.3, borderRadius: 2 }}
                      >
                        Batalkan Pengajuan
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* ════════ DIALOG AJUKAN CUTI ════════ */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          resetForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight="bold">Ajukan Cuti</DialogTitle>
        <Divider />
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            {/* Info sisa cuti */}
            {jatahCuti && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: sisaCuti > 0 ? "#e8f5e9" : "#ffebee",
                  border: `1px solid ${sisaCuti > 0 ? "#a5d6a7" : "#ef9a9a"}`,
                }}
              >
                <Typography
                  fontSize={13}
                  color={sisaCuti > 0 ? "#2e7d32" : "#c62828"}
                >
                  Sisa jatah cuti kamu: <strong>{sisaCuti} hari</strong>
                  {jumlahHari > 0 && (
                    <span>
                      {" "}
                      · Pengajuan ini: <strong>{jumlahHari} hari</strong>
                    </span>
                  )}
                </Typography>
              </Box>
            )}

            {/* Tanggal mulai */}
            <TextField
              type="date"
              fullWidth
              size="small"
              label="Tanggal Mulai *"
              value={form.tanggal_mulai}
              onChange={(e) =>
                setForm({ ...form, tanggal_mulai: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split("T")[0] }}
            />

            {/* Tanggal selesai */}
            <TextField
              type="date"
              fullWidth
              size="small"
              label="Tanggal Selesai *"
              value={form.tanggal_selesai}
              onChange={(e) =>
                setForm({ ...form, tanggal_selesai: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min:
                  form.tanggal_mulai || new Date().toISOString().split("T")[0],
              }}
            />

            {/* Preview rentang hari */}
            {form.tanggal_mulai && form.tanggal_selesai && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "#e3f2fd",
                  border: "1px solid #90caf9",
                }}
              >
                <Typography fontSize={13} color="#1565c0">
                  📅 {fmtTgl(form.tanggal_mulai)} –{" "}
                  {fmtTgl(form.tanggal_selesai)}
                  {" · "}
                  <strong>{jumlahHari} hari</strong>
                </Typography>
              </Box>
            )}

            {/* Alasan */}
            <TextField
              fullWidth
              size="small"
              label="Alasan Cuti *"
              placeholder="Contoh: Cuti tahunan, Keperluan keluarga, Cuti menikah"
              value={form.alasan}
              onChange={(e) => setForm({ ...form, alasan: e.target.value })}
              multiline
              rows={3}
            />

            {/* Upload surat */}
            <Divider />
            <Box>
              <Typography fontSize={14} fontWeight="bold" mb={1}>
                📎 Lampiran Surat (Opsional)
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
                  Klik untuk unggah surat (JPG/PNG/PDF)
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
              ) : (
                <Box
                  sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 1.5 }}
                >
                  {suratPreview.type === "image" ? (
                    <img
                      src={suratPreview.url}
                      alt="preview"
                      style={{
                        width: "100%",
                        maxHeight: 180,
                        objectFit: "contain",
                        borderRadius: 8,
                      }}
                    />
                  ) : (
                    <Box display="flex" alignItems="center" gap={1}>
                      <AttachFileIcon sx={{ color: "#1565c0" }} />
                      <Typography fontSize={13}>{suratPreview.name}</Typography>
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
                Opsional — lampirkan surat jika diperlukan sebagai pendukung
                pengajuan
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setDialogOpen(false);
              resetForm();
            }}
            variant="outlined"
            sx={{ flex: 1, borderRadius: 2 }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            sx={{ flex: 1, borderRadius: 2 }}
          >
            {saving ? "Mengirim..." : "Kirim Pengajuan"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════ DIALOG DETAIL ════════ */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight="bold">Detail Pengajuan Cuti</DialogTitle>
        <Divider />
        <DialogContent>
          {detailItem && (
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              {/* Status */}
              <Box display="flex" justifyContent="center">
                {getStatusChip(detailItem.status)}
              </Box>

              {/* Info tanggal */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography fontSize={13} color="text.secondary">
                      Tanggal Mulai
                    </Typography>
                    <Typography fontSize={13} fontWeight="bold">
                      {fmtTgl(detailItem.tanggal_mulai)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography fontSize={13} color="text.secondary">
                      Tanggal Selesai
                    </Typography>
                    <Typography fontSize={13} fontWeight="bold">
                      {fmtTgl(detailItem.tanggal_selesai)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography fontSize={13} color="text.secondary">
                      Durasi
                    </Typography>
                    <Typography fontSize={13} fontWeight="bold">
                      {hitungHari(
                        detailItem.tanggal_mulai,
                        detailItem.tanggal_selesai,
                      )}{" "}
                      hari
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography fontSize={13} color="text.secondary" mb={0.5}>
                      Alasan
                    </Typography>
                    <Typography fontSize={13}>{detailItem.alasan}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography fontSize={13} color="text.secondary">
                      Diajukan
                    </Typography>
                    <Typography fontSize={13}>
                      {fmtTgl(
                        detailItem.created_at?.slice(0, 10) ||
                          detailItem.tanggal_mulai,
                      )}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Catatan admin */}
              {detailItem.catatan_admin && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor:
                      detailItem.status === "Ditolak" ? "#ffebee" : "#e8f5e9",
                    border: `1px solid ${detailItem.status === "Ditolak" ? "#ef9a9a" : "#a5d6a7"}`,
                  }}
                >
                  <Typography
                    fontSize={12}
                    fontWeight="bold"
                    mb={0.5}
                    color={
                      detailItem.status === "Ditolak" ? "#c62828" : "#2e7d32"
                    }
                  >
                    {detailItem.status === "Ditolak"
                      ? "Alasan Penolakan:"
                      : "Catatan Admin:"}
                  </Typography>
                  <Typography
                    fontSize={13}
                    color={
                      detailItem.status === "Ditolak" ? "#c62828" : "#2e7d32"
                    }
                  >
                    {detailItem.catatan_admin}
                  </Typography>
                </Box>
              )}

              {/* Info jika disetujui */}
              {detailItem.status === "Disetujui" && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: "#e8f5e9",
                    border: "1px solid #a5d6a7",
                  }}
                >
                  <Typography fontSize={12} color="#2e7d32">
                    ✅ Cuti kamu telah disetujui. Jadwal shift pada tanggal
                    tersebut telah otomatis diubah menjadi Cuti (CT) — kamu
                    tidak perlu absen pada hari-hari tersebut.
                  </Typography>
                </Box>
              )}

              {/* Lampiran */}
              {detailItem.surat_cuti && (
                <Button
                  variant="outlined"
                  startIcon={<AttachFileIcon />}
                  fullWidth
                  onClick={() =>
                    window.open(
                      `http://localhost:5000/uploads/surat_cuti/${detailItem.surat_cuti}`,
                      "_blank",
                    )
                  }
                >
                  Lihat Lampiran Surat
                </Button>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDetailOpen(false)}
            variant="outlined"
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════ DIALOG KONFIRMASI BATAL ════════ */}
      <Dialog
        open={batalOpen}
        onClose={() => setBatalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight="bold">Batalkan Pengajuan?</DialogTitle>
        <Divider />
        <DialogContent>
          <Typography fontSize={13}>
            Batalkan pengajuan cuti tanggal{" "}
            <strong>{batalItem ? fmtTgl(batalItem.tanggal_mulai) : ""}</strong>
            {batalItem?.tanggal_mulai !== batalItem?.tanggal_selesai &&
              ` – ${fmtTgl(batalItem?.tanggal_selesai)}`}
            ?
          </Typography>
          <Typography fontSize={12} color="error" mt={1}>
            Pengajuan yang dibatalkan tidak dapat dikembalikan.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setBatalOpen(false)}
            variant="outlined"
            sx={{ flex: 1, borderRadius: 2 }}
          >
            Tidak
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleBatal}
            sx={{ flex: 1, borderRadius: 2 }}
          >
            Ya, Batalkan
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
    </DashboardLayoutPegawai>
  );
}
