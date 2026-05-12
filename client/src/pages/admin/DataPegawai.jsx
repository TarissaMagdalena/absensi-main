import { useState, useEffect } from "react";
import { api } from "../../utils/api"; // ← pakai axios instance, bukan axios langsung
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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

// ═════════════════════════════════════════════════════════════════════════════
export default function DataPegawai() {
  // ── State data ──────────────────────────────────────────────────────────────
  const [pegawai, setPegawai] = useState([]);
  const [search, setSearch] = useState("");

  // ── State dialog edit ────────────────────────────────────────────────────────
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState(null);

  // ── State trigger reload ─────────────────────────────────────────────────────
  const [refresh, setRefresh] = useState(0);

  // ── State notifikasi snackbar ────────────────────────────────────────────────
  const [notif, setNotif] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const showNotif = (message, severity = "success") =>
    setNotif({ open: true, message, severity });

  // ── Fetch daftar pegawai — diulang setiap kali refresh berubah ───────────────
  useEffect(() => {
    api
      .get("/pegawai")
      .then((res) => setPegawai(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Gagal load pegawai:", err));
  }, [refresh]);

  // ── Filter berdasarkan nama, NIK, atau email ──────────────────────────────────
  const filteredPegawai = pegawai.filter(
    (p) =>
      p.nama?.toLowerCase().includes(search.toLowerCase()) ||
      p.nik?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Buka dialog edit dengan data pegawai yang dipilih ────────────────────────
  const handleOpenEdit = (p) => {
    setEditData({ ...p });
    setOpenEdit(true);
  };

  // ── Simpan perubahan data kontak pegawai ──────────────────────────────────────
  const handleEdit = async () => {
    try {
      await api.put(`/pegawai/${editData.id}`, editData);
      showNotif("✅ Data pegawai berhasil diupdate");
      setOpenEdit(false);
      setRefresh((r) => r + 1); // trigger useEffect untuk reload data
    } catch (err) {
      showNotif(
        err.response?.data?.message || "Gagal mengupdate pegawai",
        "error",
      );
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayoutAdmin>
      <Box>
        {/* ── HEADER ── */}
        <Typography variant="h5" fontWeight="bold">
          Data Pegawai
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Daftar seluruh pegawai yang terdaftar dalam sistem
        </Typography>

        <Paper sx={{ p: 3, borderRadius: 3 }}>
          {/* ── SEARCH + INFO ── */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
            mb={2}
          >
            <TextField
              placeholder="Cari nama, NIK, atau email..."
              size="small"
              sx={{ flex: 1 }}
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
                whiteSpace: "nowrap",
                fontSize: 12,
              }}
            >
              💡 Tambah pegawai melalui menu Manajemen Akun
            </Typography>
          </Box>

          {/* ── TABEL PEGAWAI ── */}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Nama</TableCell>
                <TableCell>NIK</TableCell>
                <TableCell>No HP</TableCell>
                <TableCell>Email Pribadi</TableCell>
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
                    <TableCell sx={{ fontWeight: "bold" }}>{p.nama}</TableCell>
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
        </Paper>
      </Box>

      {/* ════════ DIALOG EDIT DATA KONTAK ════════ */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle fontWeight="bold">Edit Data Kontak Pegawai</DialogTitle>
        <DialogContent>
          {editData && (
            <Box display="flex" flexDirection="column" gap={0}>
              {/* Nama — disabled, diatur dari Manajemen Akun */}
              <TextField
                fullWidth
                label="Nama"
                margin="dense"
                value={editData.nama}
                disabled
                helperText="Nama diatur dari Manajemen Akun"
              />

              {/* NIK */}
              <TextField
                fullWidth
                label="NIK"
                margin="dense"
                value={editData.nik || ""}
                onChange={(e) =>
                  setEditData({ ...editData, nik: e.target.value })
                }
              />

              {/* No HP */}
              <TextField
                fullWidth
                label="No HP"
                margin="dense"
                value={editData.no_hp || ""}
                onChange={(e) =>
                  setEditData({ ...editData, no_hp: e.target.value })
                }
              />

              {/* Email pribadi (bukan email login) */}
              <TextField
                fullWidth
                label="Email Pribadi"
                margin="dense"
                value={editData.email || ""}
                onChange={(e) =>
                  setEditData({ ...editData, email: e.target.value })
                }
                helperText="Email pribadi pegawai (bukan email login)"
              />

              {/* Alamat */}
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
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Batal</Button>
          <Button variant="contained" onClick={handleEdit}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════ SNACKBAR NOTIFIKASI ════════ */}
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
