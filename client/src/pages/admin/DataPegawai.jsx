// ═══════════════════════════════════════════════════════════════
// DATA PEGAWAI — Halaman admin untuk melihat & edit kontak pegawai
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
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
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

export default function DataPegawai() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const [pegawai, setPegawai] = useState([]);
  const [search, setSearch] = useState("");
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [refresh, setRefresh] = useState(0); // ── refresh — trick untuk trigger useEffect fetch ulang ──────
  const [notif, setNotif] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotif = (message, severity = "success") =>
    setNotif({ open: true, message, severity });

  // ── Fetch data pegawai — diulang setiap refresh berubah ──────
  useEffect(() => {
    api
      .get("/pegawai")
      .then((res) => setPegawai(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Gagal load pegawai:", err));
  }, [refresh]); // ← dependency refresh → jalan ulang setiap refresh berubah

  // ── Filter pegawai di sisi frontend ──────────────────────────
  const filteredPegawai = pegawai.filter(
    (p) =>
      p.nama?.toLowerCase().includes(search.toLowerCase()) ||
      p.nik?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenEdit = (p) => {
    setEditData({ ...p });
    setOpenEdit(true);
  };

  // ── Simpan perubahan kontak pegawai ──────────────────────────
  const handleEdit = async () => {
    try {
      await api.put(`/pegawai/${editData.id}`, editData);
      showNotif("✅ Data pegawai berhasil diupdate");
      setOpenEdit(false);
      setRefresh((r) => r + 1);
    } catch (err) {
      showNotif(
        err.response?.data?.message || "Gagal mengupdate pegawai",
        "error",
      );
    }
  };

  // ── Bottom sheet untuk dialog di mobile ──────────────────────
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
      "& .MuiDialog-container": {
        alignItems: isSmall ? "flex-end" : "center",
      },
    },
  };

  return (
    <DashboardLayoutAdmin>
      <Box>
        {/* HEADER */}
        <Typography variant="h5" fontWeight="bold">
          Data Kontak Pegawai
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Daftar informasi kontak pribadi pegawai yang terdaftar dalam sistem
        </Typography>

        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          {/* SEARCH + INFO */}
          <Box
            display="flex"
            alignItems={{ xs: "flex-start", sm: "center" }}
            flexDirection={{ xs: "column", sm: "row" }}
            gap={2}
            mb={2}
          >
            <TextField
              placeholder="Cari nama, NIK, atau email..."
              size="small"
              sx={{ width: { xs: "100%", sm: "auto" }, flex: { sm: 1 } }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                px: 2,
                py: 1,
                backgroundColor: "#e3f2fd",
                borderRadius: 2,
                fontSize: 12,
                whiteSpace: { xs: "normal", sm: "nowrap" },
              }}
            >
              💡 Tambah pegawai melalui menu Manajemen Akun
            </Typography>
          </Box>

          {/*  CARD (mobile) / TABEL (desktop) */}
          {isMobile ? (
            <Box>
              {filteredPegawai.length > 0 ? (
                filteredPegawai.map((p, i) => (
                  <Card
                    key={p.id}
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      mb: 1.5,
                      "&:hover": { boxShadow: 2 },
                    }}
                  >
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      {/* Baris atas: nomor, nama, tombol edit */}
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
                            {i + 1}
                          </Typography>
                          <Typography fontWeight="bold" fontSize={14}>
                            {p.nama}
                          </Typography>
                        </Box>
                        <Tooltip title="Edit Data Kontak">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenEdit(p)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Divider sx={{ mb: 1 }} />

                      {/* Detail pegawai */}
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Box display="flex" gap={1}>
                          <Typography
                            fontSize={12}
                            color="text.secondary"
                            minWidth={80}
                          >
                            NIK
                          </Typography>
                          <Typography fontSize={12} fontWeight="bold">
                            {p.nik || "-"}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={1}>
                          <Typography
                            fontSize={12}
                            color="text.secondary"
                            minWidth={80}
                          >
                            No HP
                          </Typography>
                          <Typography fontSize={12}>
                            {p.no_hp || "-"}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={1}>
                          <Typography
                            fontSize={12}
                            color="text.secondary"
                            minWidth={80}
                          >
                            email
                          </Typography>
                          <Typography
                            fontSize={12}
                            sx={{ wordBreak: "break-all" }}
                          >
                            {p.email || "-"}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={1}>
                          <Typography
                            fontSize={12}
                            color="text.secondary"
                            minWidth={80}
                          >
                            Alamat
                          </Typography>
                          <Typography fontSize={12} sx={{ flex: 1 }}>
                            {p.alamat || "-"}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography color="text.secondary">
                    {search ? "Data tidak ditemukan" : "Tidak ada data"}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            // TABEL DESKTOP — tidak diubah
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>Nama</TableCell>
                    <TableCell>NIK</TableCell>
                    <TableCell>No HP</TableCell>
                    <TableCell>email Pribadi</TableCell>
                    <TableCell>Alamat</TableCell>
                    <TableCell align="center">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPegawai.length > 0 ? (
                    filteredPegawai.map((p, i) => (
                      <TableRow
                        key={p.id}
                        sx={{ "&:hover": { backgroundColor: "#fafafa" } }}
                      >
                        <TableCell>{i + 1}</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          {p.nama}
                        </TableCell>
                        <TableCell>{p.nik || "-"}</TableCell>
                        <TableCell>{p.no_hp || "-"}</TableCell>
                        <TableCell>{p.email || "-"}</TableCell>
                        <TableCell>{p.alamat || "-"}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit Data Kontak">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleOpenEdit(p)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        align="center"
                        sx={{ py: 3, color: "text.secondary" }}
                      >
                        {search ? "Data tidak ditemukan" : "Tidak ada data"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </Paper>
      </Box>

      {/* DIALOG EDIT — bottom sheet di mobile */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={false}
        {...bottomSheetProps}
      >
        <DialogTitle fontWeight="bold">Edit Data Kontak Pegawai</DialogTitle>
        <Divider />
        <DialogContent dividers>
          {editData && (
            <Box display="flex" flexDirection="column" gap={0}>
              <TextField
                fullWidth
                label="Nama"
                margin="dense"
                value={editData.nama}
                disabled
                helperText="Nama diatur dari Manajemen Akun"
              />
              <TextField
                fullWidth
                label="NIK"
                margin="dense"
                value={editData.nik || ""}
                onChange={(e) =>
                  setEditData({ ...editData, nik: e.target.value })
                }
              />
              <TextField
                fullWidth
                label="No HP"
                margin="dense"
                value={editData.no_hp || ""}
                onChange={(e) =>
                  setEditData({ ...editData, no_hp: e.target.value })
                }
              />
              <TextField
                fullWidth
                label="email Pribadi"
                margin="dense"
                value={editData.email || ""}
                onChange={(e) =>
                  setEditData({ ...editData, email: e.target.value })
                }
                helperText="email pribadi pegawai (bukan email login)"
              />
              <TextField
                fullWidth
                label="Alamat"
                margin="dense"
                multiline
                rows={3}
                value={editData.alamat || ""}
                onChange={(e) =>
                  setEditData({ ...editData, alamat: e.target.value })
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setOpenEdit(false)}
            variant="outlined"
            sx={{ flex: 1, borderRadius: 2 }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleEdit}
            sx={{ flex: 1, borderRadius: 2 }}
          >
            Simpan Perubahan
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={notif.open}
        autoHideDuration={3000}
        onClose={() => setNotif({ ...notif, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={notif.severity} variant="filled">
          {notif.message}
        </Alert>
      </Snackbar>
    </DashboardLayoutAdmin>
  );
}
