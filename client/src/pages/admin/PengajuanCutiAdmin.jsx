import { useState, useEffect, useCallback } from "react";
import { api } from "../../utils/api";
import DashboardLayoutAdmin from "../../layout/DashboardLayoutAdmin";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Divider,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Stack,
  MenuItem,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EventIcon from "@mui/icons-material/Event";
import PendingIcon from "@mui/icons-material/Pending";
import PersonIcon from "@mui/icons-material/Person";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTgl = (tgl) =>
  new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const fmtTglPendek = (tgl) =>
  new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
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
      label="Menunggu"
      color="warning"
      size="small"
      sx={{ fontWeight: "bold" }}
    />
  );
};

// ═════════════════════════════════════════════════════════════════════════════
export default function PengajuanCutiAdmin() {
  // ── State data ──────────────────────────────────────────────────────────────
  const [list, setList] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterNama, setFilterNama] = useState("");

  // ── State dialog detail ──────────────────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  // ── State dialog approve ─────────────────────────────────────────────────────
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveItem, setApproveItem] = useState(null);
  const [catatanACC, setCatatanACC] = useState("");
  const [loadingACC, setLoadingACC] = useState(false);

  // ── State dialog reject ──────────────────────────────────────────────────────
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectItem, setRejectItem] = useState(null);
  const [catatanTolak, setCatatanTolak] = useState("");
  const [loadingTolak, setLoadingTolak] = useState(false);

  // ── Snackbar ─────────────────────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  // ── Fetch semua pengajuan ─────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/pengajuan-cuti");
      setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Gagal fetch pengajuan cuti:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredList = list.filter((item) => {
    const matchNama = item.nama
      ?.toLowerCase()
      .includes(filterNama.toLowerCase());
    const matchStatus = filterStatus ? item.status === filterStatus : true;
    return matchNama && matchStatus;
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalMenunggu = list.filter((d) => d.status === "Menunggu").length;
  const totalDisetujui = list.filter((d) => d.status === "Disetujui").length;
  const totalDitolak = list.filter((d) => d.status === "Ditolak").length;

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!approveItem) return;
    setLoadingACC(true);
    try {
      await api.put(`/pengajuan-cuti/${approveItem.id}/approve`, {
        catatan_admin: catatanACC || null,
      });
      showSnackbar(
        "✅ Pengajuan cuti disetujui dan jadwal berhasil diperbarui",
      );
      setApproveOpen(false);
      setCatatanACC("");
      setApproveItem(null);
      fetchData();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Gagal menyetujui pengajuan",
        "error",
      );
    } finally {
      setLoadingACC(false);
    }
  };

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!rejectItem) return;
    if (!catatanTolak.trim())
      return showSnackbar("Alasan penolakan wajib diisi", "error");
    setLoadingTolak(true);
    try {
      await api.put(`/pengajuan-cuti/${rejectItem.id}/reject`, {
        catatan_admin: catatanTolak.trim(),
      });
      showSnackbar("Pengajuan cuti ditolak");
      setRejectOpen(false);
      setCatatanTolak("");
      setRejectItem(null);
      fetchData();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Gagal menolak pengajuan",
        "error",
      );
    } finally {
      setLoadingTolak(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayoutAdmin>
      <Box>
        {/* ── HEADER ── */}
        <Box mb={3}>
          <Typography variant="h5" fontWeight="bold">
            Pengajuan Cuti
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kelola dan tinjau pengajuan cuti pegawai
          </Typography>
        </Box>

        {/* ── SUMMARY CARDS ── */}
        <Box display="flex" gap={2} flexWrap="wrap" mb={3}>
          {[
            {
              label: "Menunggu Persetujuan",
              value: totalMenunggu,
              color: "#e65100",
              bg: "#fff3e0",
            },
            {
              label: "Disetujui",
              value: totalDisetujui,
              color: "#2e7d32",
              bg: "#e8f5e9",
            },
            {
              label: "Ditolak",
              value: totalDitolak,
              color: "#c62828",
              bg: "#ffebee",
            },
            {
              label: "Total Pengajuan",
              value: list.length,
              color: "#333",
              bg: "#f5f5f5",
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
                minWidth: 130,
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

        {/* ── FILTER ── */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              size="small"
              placeholder="Cari Nama Pegawai"
              value={filterNama}
              onChange={(e) => setFilterNama(e.target.value)}
              sx={{ minWidth: 220 }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Semua Status</MenuItem>
              <MenuItem value="Menunggu">Menunggu</MenuItem>
              <MenuItem value="Disetujui">Disetujui</MenuItem>
              <MenuItem value="Ditolak">Ditolak</MenuItem>
            </TextField>
            <Button
              variant="outlined"
              size="small"
              sx={{ height: 40 }}
              onClick={() => {
                setFilterNama("");
                setFilterStatus("");
              }}
            >
              Reset
            </Button>
          </Box>
        </Paper>

        {/* ── TABEL ── */}
        <Paper sx={{ borderRadius: 3, overflow: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Pegawai</TableCell>
                <TableCell>Tanggal Mulai</TableCell>
                <TableCell>Tanggal Selesai</TableCell>
                <TableCell>Durasi</TableCell>
                <TableCell>Alasan</TableCell>
                <TableCell>Lampiran</TableCell>
                <TableCell>Diajukan</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Catatan</TableCell>
                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredList.length > 0 ? (
                filteredList.map((item, i) => (
                  <TableRow
                    key={item.id}
                    sx={{ "&:hover": { backgroundColor: "#fafafa" } }}
                  >
                    <TableCell>{i + 1}</TableCell>

                    {/* Nama + NIK */}
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon
                          sx={{ fontSize: 16, color: "text.disabled" }}
                        />
                        <Box>
                          <Typography fontWeight="bold" fontSize={13}>
                            {item.nama}
                          </Typography>
                          <Typography fontSize={11} color="text.secondary">
                            {item.nik}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {fmtTglPendek(item.tanggal_mulai)}
                    </TableCell>

                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {fmtTglPendek(item.tanggal_selesai)}
                    </TableCell>

                    {/* Durasi */}
                    <TableCell>
                      <Chip
                        label={`${hitungHari(item.tanggal_mulai, item.tanggal_selesai)} hari`}
                        size="small"
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>

                    {/* Alasan truncate */}
                    <TableCell sx={{ maxWidth: 160 }}>
                      <Tooltip title={item.alasan} placement="top">
                        <Typography
                          fontSize={13}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.alasan}
                        </Typography>
                      </Tooltip>
                    </TableCell>

                    {/* Lampiran */}
                    <TableCell>
                      {item.surat_cuti ? (
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
                            <AttachFileIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography fontSize={12} color="text.disabled">
                          -
                        </Typography>
                      )}
                    </TableCell>

                    {/* Tanggal diajukan */}
                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        fontSize: 12,
                        color: "text.secondary",
                      }}
                    >
                      {fmtTglPendek(
                        item.created_at?.slice(0, 10) || item.tanggal_mulai,
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>{getStatusChip(item.status)}</TableCell>

                    {/* Catatan admin */}
                    <TableCell sx={{ maxWidth: 150 }}>
                      {item.catatan_admin ? (
                        <Tooltip title={item.catatan_admin} placement="top">
                          <Typography
                            fontSize={12}
                            color="text.secondary"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.catatan_admin}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography fontSize={12} color="text.disabled">
                          -
                        </Typography>
                      )}
                    </TableCell>

                    {/* Aksi */}
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <Tooltip title="Lihat Detail">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setDetailItem(item);
                              setDetailOpen(true);
                            }}
                            sx={{ color: "#555" }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {item.status === "Menunggu" && (
                          <>
                            <Tooltip title="Setujui">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setApproveItem(item);
                                  setApproveOpen(true);
                                }}
                                sx={{ color: "#2e7d32" }}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Tolak">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setRejectItem(item);
                                  setRejectOpen(true);
                                }}
                                sx={{ color: "#c62828" }}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    Tidak ada data pengajuan cuti
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>

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
              <Box display="flex" justifyContent="center">
                {getStatusChip(detailItem.status)}
              </Box>

              {/* Info pegawai */}
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <PersonIcon sx={{ fontSize: 18, color: "#1565c0" }} />
                    <Typography fontWeight="bold" fontSize={14} color="#1565c0">
                      Informasi Pegawai
                    </Typography>
                  </Box>
                  <Stack spacing={0.8}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={13} color="text.secondary">
                        Nama
                      </Typography>
                      <Typography fontSize={13} fontWeight="bold">
                        {detailItem.nama}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={13} color="text.secondary">
                        NIK
                      </Typography>
                      <Typography fontSize={13}>
                        {detailItem.nik || "-"}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Info cuti */}
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <EventIcon sx={{ fontSize: 18, color: "#1565c0" }} />
                    <Typography fontWeight="bold" fontSize={14} color="#1565c0">
                      Detail Cuti
                    </Typography>
                  </Box>
                  <Stack spacing={0.8}>
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
                        Diajukan pada
                      </Typography>
                      <Typography fontSize={13}>
                        {fmtTgl(
                          detailItem.created_at?.slice(0, 10) ||
                            detailItem.tanggal_mulai,
                        )}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

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
                      : "Catatan:"}
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
                    backgroundColor: "#e3f2fd",
                    border: "1px solid #90caf9",
                  }}
                >
                  <Typography fontSize={12} color="#1565c0">
                    ℹ️ Jadwal shift pegawai pada tanggal tersebut telah otomatis
                    diubah menjadi <strong>Cuti (CT)</strong>.
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

              {/* Tombol aksi jika masih Menunggu */}
              {detailItem.status === "Menunggu" && (
                <Box display="flex" gap={1.5}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => {
                      setDetailOpen(false);
                      setApproveItem(detailItem);
                      setApproveOpen(true);
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    Setujui
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      setDetailOpen(false);
                      setRejectItem(detailItem);
                      setRejectOpen(true);
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    Tolak
                  </Button>
                </Box>
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

      {/* ════════ DIALOG APPROVE ════════ */}
      <Dialog
        open={approveOpen}
        onClose={() => {
          setApproveOpen(false);
          setCatatanACC("");
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight="bold" color="#2e7d32">
          ✅ Setujui Pengajuan Cuti
        </DialogTitle>
        <Divider />
        <DialogContent>
          {approveItem && (
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "#e8f5e9",
                  border: "1px solid #a5d6a7",
                }}
              >
                <Typography fontSize={13} fontWeight="bold" color="#2e7d32">
                  {approveItem.nama}
                </Typography>
                <Typography fontSize={13} color="#2e7d32">
                  {fmtTgl(approveItem.tanggal_mulai)} –{" "}
                  {fmtTgl(approveItem.tanggal_selesai)}
                  {" · "}
                  {hitungHari(
                    approveItem.tanggal_mulai,
                    approveItem.tanggal_selesai,
                  )}{" "}
                  hari
                </Typography>
                <Typography fontSize={12} color="#2e7d32" mt={0.5}>
                  {approveItem.alasan}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "#e3f2fd",
                  border: "1px solid #90caf9",
                }}
              >
                <Typography fontSize={12} color="#1565c0">
                  ℹ️ Setelah disetujui, jadwal shift pegawai pada tanggal
                  tersebut akan otomatis berubah menjadi{" "}
                  <strong>Cuti (CT)</strong> dan pegawai tidak perlu melakukan
                  absensi.
                </Typography>
              </Box>
              <TextField
                fullWidth
                size="small"
                label="Catatan (Opsional)"
                placeholder="Contoh: Pengajuan disetujui, selamat menikmati cuti"
                value={catatanACC}
                onChange={(e) => setCatatanACC(e.target.value)}
                multiline
                rows={2}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setApproveOpen(false);
              setCatatanACC("");
            }}
            variant="outlined"
            sx={{ flex: 1, borderRadius: 2 }}
            disabled={loadingACC}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={loadingACC}
            sx={{ flex: 1, borderRadius: 2 }}
          >
            {loadingACC ? "Memproses..." : "Ya, Setujui"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════ DIALOG REJECT ════════ */}
      <Dialog
        open={rejectOpen}
        onClose={() => {
          setRejectOpen(false);
          setCatatanTolak("");
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight="bold" color="#c62828">
          ❌ Tolak Pengajuan Cuti
        </DialogTitle>
        <Divider />
        <DialogContent>
          {rejectItem && (
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "#ffebee",
                  border: "1px solid #ef9a9a",
                }}
              >
                <Typography fontSize={13} fontWeight="bold" color="#c62828">
                  {rejectItem.nama}
                </Typography>
                <Typography fontSize={13} color="#c62828">
                  {fmtTgl(rejectItem.tanggal_mulai)} –{" "}
                  {fmtTgl(rejectItem.tanggal_selesai)}
                  {" · "}
                  {hitungHari(
                    rejectItem.tanggal_mulai,
                    rejectItem.tanggal_selesai,
                  )}{" "}
                  hari
                </Typography>
                <Typography fontSize={12} color="#c62828" mt={0.5}>
                  {rejectItem.alasan}
                </Typography>
              </Box>
              <TextField
                fullWidth
                size="small"
                label="Alasan Penolakan *"
                placeholder="Contoh: Kebutuhan operasional tidak memungkinkan"
                value={catatanTolak}
                onChange={(e) => setCatatanTolak(e.target.value)}
                multiline
                rows={3}
                error={!catatanTolak.trim()}
                helperText={
                  !catatanTolak.trim() ? "Alasan penolakan wajib diisi" : ""
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setRejectOpen(false);
              setCatatanTolak("");
            }}
            variant="outlined"
            sx={{ flex: 1, borderRadius: 2 }}
            disabled={loadingTolak}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={loadingTolak || !catatanTolak.trim()}
            sx={{ flex: 1, borderRadius: 2 }}
          >
            {loadingTolak ? "Memproses..." : "Ya, Tolak"}
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
    </DashboardLayoutAdmin>
  );
}
