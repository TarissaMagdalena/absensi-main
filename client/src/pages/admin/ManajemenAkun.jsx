// ═══════════════════════════════════════════════════════════════
// MANAJEMEN AKUN — Halaman admin untuk CRUD akun login
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import DashboardLayoutAdmin from "../../layout/DashboardLayoutAdmin";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

// ── Nilai awal form tambah akun ───────────────────────────────────────────────
const FORM_INIT = { nama: "", username: "", password: "", role: "pegawai" };
const NOTIF_INIT = { open: false, message: "", severity: "success" };

export default function ManajemenAkun() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const [akun, setAkun] = useState([]); // daftar semua akun dari API
  const [form, setForm] = useState(FORM_INIT);
  const [notif, setNotif] = useState(NOTIF_INIT);
  const [dialogEdit, setDialogEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [gantiPassword, setGantiPassword] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  const closeNotif = () => setNotif((n) => ({ ...n, open: false }));
  const showNotif = (message, severity = "success") =>
    setNotif({ open: true, message, severity });
  // ── Load daftar akun ───────────────────────────────────────────
  const loadAkun = () => {
    apiFetch("http://localhost:5000/api/users")
      .then((res) => res.json())
      .then((data) => setAkun(Array.isArray(data) ? data : []))
      .catch(() => setAkun([]));
  };

  useEffect(() => {
    loadAkun();
  }, []);
  // ── Handle perubahan field form tambah ────────────────────────
  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  // ── Tambah akun baru ──────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.nama || !form.username || !form.password) {
      showNotif("Lengkapi semua field!", "warning");
      return;
    }
    try {
      const res = await apiFetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotif(data.message, "error");
        return;
      }
      showNotif("✅ Akun berhasil dibuat!");
      setForm(FORM_INIT);
      loadAkun();
    } catch {
      showNotif("Gagal terhubung ke server", "error");
    }
  };
  // ── Buka dialog edit ──────────────────────────────────────────
  const handleOpenEdit = (a) => {
    setEditData({
      id: a.id,
      nama: a.nama,
      username: a.username,
      role: a.role,
      password: "",
    });
    setGantiPassword(false);
    setDialogEdit(true);
  };
  // ── Simpan perubahan akun ─────────────────────────────────────
  const handleSimpanEdit = async () => {
    if (!editData.nama || !editData.username) {
      showNotif("Nama dan username wajib diisi", "warning");
      return;
    }
    if (gantiPassword && !editData.password) {
      showNotif("Isi password baru", "warning");
      return;
    }
    try {
      const body = {
        nama: editData.nama,
        username: editData.username,
        role: editData.role,
      };
      if (gantiPassword && editData.password) body.password = editData.password;
      const res = await apiFetch(
        `http://localhost:5000/api/users/${editData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        showNotif(data.message, "error");
        return;
      }
      showNotif("✅ Akun berhasil diupdate!");
      setDialogEdit(false);
      loadAkun();
    } catch {
      showNotif("Gagal terhubung ke server", "error");
    }
  };
  // ── Hapus akun ────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      const res = await apiFetch(
        `http://localhost:5000/api/users/${deleteDialog.item.id}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();
      if (!res.ok) {
        showNotif(data.message, "error");
        return;
      }
      showNotif("Akun berhasil dihapus");
      setDeleteDialog({ open: false, item: null });
      loadAkun();
    } catch {
      showNotif("Gagal menghapus akun", "error");
    }
  };

  // 🔥 Bottom sheet props untuk mobile
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
      <Typography variant="h5" fontWeight="bold">
        Manajemen Akun
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Kelola akun login pegawai dan hak akses sistem
      </Typography>

      {/* FORM TAMBAH */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
        <Typography fontWeight="bold" mb={2}>
          Tambah Akun Pegawai
        </Typography>
        <Box
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
          gap={2}
        >
          {/* 🔥 Input stack ke bawah di mobile */}
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            gap={2}
            flexWrap="wrap"
            flex={1}
          >
            <TextField
              size="small"
              label="Nama Lengkap"
              name="nama"
              value={form.nama}
              onChange={handleChange}
              sx={{ minWidth: { xs: "100%", sm: 180 } }}
            />
            <TextField
              size="small"
              label="Nama Pengguna"
              name="username"
              type="username"
              value={form.username}
              onChange={handleChange}
              sx={{ minWidth: { xs: "100%", sm: 200 } }}
            />
            <TextField
              size="small"
              label="Kata Sandi"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              sx={{ minWidth: { xs: "100%", sm: 180 } }}
            />
            <TextField
              select
              size="small"
              label="Role"
              name="role"
              value={form.role}
              onChange={handleChange}
              sx={{ minWidth: { xs: "100%", sm: 140 } }}
            >
              <MenuItem value="pegawai">Pegawai</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Box>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              height: 40,
              whiteSpace: "nowrap",
              width: { xs: "100%", md: "auto" },
            }}
          >
            Simpan Akun
          </Button>
        </Box>
      </Paper>

      {/* 🔥 CARD (mobile) / TABEL (desktop) */}
      {isMobile ? (
        <Box>
          {akun.length > 0 ? (
            akun.map((a, i) => (
              <Card
                key={a.id}
                variant="outlined"
                sx={{ borderRadius: 3, mb: 1.5, "&:hover": { boxShadow: 2 } }}
              >
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
                        {i + 1}
                      </Typography>
                      <Typography fontWeight="bold" fontSize={14}>
                        {a.nama}
                      </Typography>
                    </Box>
                    <Chip
                      label={a.role}
                      size="small"
                      color={a.role === "admin" ? "primary" : "default"}
                    />
                  </Box>

                  <Divider sx={{ mb: 1 }} />

                  <Typography fontSize={12} color="text.secondary" mb={1}>
                    {a.username}
                  </Typography>

                  <Box display="flex" justifyContent="flex-end" gap={0.5}>
                    <Tooltip title="Edit Akun">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleOpenEdit(a)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Hapus Akun">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => setDeleteDialog({ open: true, item: a })}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            ))
          ) : (
            <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                Tidak ada data akun
              </Typography>
            </Paper>
          )}
        </Box>
      ) : (
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Nama</TableCell>
                <TableCell>Nama Pengguna</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {akun.length > 0 ? (
                akun.map((a, i) => (
                  <TableRow
                    key={a.id}
                    sx={{ "&:hover": { backgroundColor: "#fafafa" } }}
                  >
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{a.nama}</TableCell>
                    <TableCell>{a.username}</TableCell>
                    <TableCell>
                      <Chip
                        label={a.role}
                        size="small"
                        color={a.role === "admin" ? "primary" : "default"}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <Tooltip title="Edit Akun">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenEdit(a)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hapus Akun">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() =>
                              setDeleteDialog({ open: true, item: a })
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    Tidak ada data akun
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* DIALOG EDIT */}
      <Dialog
        open={dialogEdit}
        onClose={() => setDialogEdit(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={false}
        {...bottomSheetProps}
      >
        <DialogTitle fontWeight="bold">Edit Akun</DialogTitle>
        <Divider />
        <DialogContent dividers>
          {editData && (
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <TextField
                fullWidth
                size="small"
                label="Nama Lengkap"
                value={editData.nama}
                onChange={(e) =>
                  setEditData({ ...editData, nama: e.target.value })
                }
              />
              <TextField
                fullWidth
                size="small"
                label="Nama Pengguna"
                type="username"
                value={editData.username}
                onChange={(e) =>
                  setEditData({ ...editData, username: e.target.value })
                }
              />
              <TextField
                select
                fullWidth
                size="small"
                label="Role"
                value={editData.role}
                onChange={(e) =>
                  setEditData({ ...editData, role: e.target.value })
                }
              >
                <MenuItem value="pegawai">Pegawai</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
              <Divider />
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography fontSize={14} color="text.secondary">
                  Ganti Kata Sandi
                </Typography>
                <Button
                  size="small"
                  variant={gantiPassword ? "contained" : "outlined"}
                  onClick={() => {
                    setGantiPassword(!gantiPassword);
                    setEditData({ ...editData, password: "" });
                  }}
                >
                  {gantiPassword
                    ? "Batal Ganti Kata Sandi"
                    : "Ganti Kata Sandi"}
                </Button>
              </Box>
              {gantiPassword && (
                <TextField
                  fullWidth
                  size="small"
                  label="Kata Sandi Baru"
                  type="password"
                  value={editData.password}
                  onChange={(e) =>
                    setEditData({ ...editData, password: e.target.value })
                  }
                  helperText="Minimal 6 karakter"
                />
              )}
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDialogEdit(false)}
            variant="outlined"
            sx={{ flex: 1, borderRadius: 2 }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleSimpanEdit}
            sx={{ flex: 1, borderRadius: 2 }}
          >
            Simpan
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG HAPUS */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, item: null })}
        maxWidth="xs"
        fullWidth
        fullScreen={false}
        {...bottomSheetProps}
      >
        <DialogTitle fontWeight="bold">Hapus Akun</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Typography>
            Hapus akun <strong>{deleteDialog.item?.nama}</strong>?
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
            onClick={handleDelete}
            sx={{ flex: 1, borderRadius: 2 }}
          >
            Hapus
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={notif.open}
        autoHideDuration={3000}
        onClose={closeNotif}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={notif.severity} variant="filled" onClose={closeNotif}>
          {notif.message}
        </Alert>
      </Snackbar>
    </DashboardLayoutAdmin>
  );
}
