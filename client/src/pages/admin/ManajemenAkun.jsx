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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const FORM_INIT = { nama: "", email: "", password: "", role: "pegawai" };
const NOTIF_INIT = { open: false, message: "", severity: "success" };

export default function ManajemenAkun() {
  const [akun, setAkun] = useState([]);
  const [form, setForm] = useState(FORM_INIT);
  const [notif, setNotif] = useState(NOTIF_INIT);

  // ── State edit ──
  const [dialogEdit, setDialogEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [gantiPassword, setGantiPassword] = useState(false);

  const closeNotif = () => setNotif((n) => ({ ...n, open: false }));
  const showNotif = (message, severity = "success") =>
    setNotif({ open: true, message, severity });

  const loadAkun = () => {
    apiFetch("http://localhost:5000/api/users")
      .then((res) => res.json())
      .then((data) => setAkun(Array.isArray(data) ? data : []))
      .catch(() => setAkun([]));
  };

  useEffect(() => {
    loadAkun();
  }, []);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // ── Tambah akun ──
  const handleSubmit = async () => {
    if (!form.nama || !form.email || !form.password) {
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

  // ── Buka dialog edit ──
  const handleOpenEdit = (a) => {
    setEditData({
      id: a.id,
      nama: a.nama,
      email: a.email,
      role: a.role,
      password: "",
    });
    setGantiPassword(false);
    setDialogEdit(true);
  };

  // ── Simpan edit ──
  const handleSimpanEdit = async () => {
    if (!editData.nama || !editData.email) {
      showNotif("Nama dan email wajib diisi", "warning");
      return;
    }
    if (gantiPassword && !editData.password) {
      showNotif("Isi password baru", "warning");
      return;
    }
    try {
      const body = {
        nama: editData.nama,
        email: editData.email,
        role: editData.role,
      };
      if (gantiPassword && editData.password) {
        body.password = editData.password;
      }

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

  // ── Hapus akun ──
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus akun ini?")) return;
    try {
      const res = await apiFetch(`http://localhost:5000/api/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showNotif(data.message, "error");
        return;
      }
      showNotif("Akun berhasil dihapus");
      loadAkun();
    } catch {
      showNotif("Gagal menghapus akun", "error");
    }
  };

  return (
    <DashboardLayoutAdmin>
      <Typography variant="h5" fontWeight="bold">
        Manajemen Akun
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Kelola akun login pegawai — tambah atau hapus akses sistem
      </Typography>

      {/* FORM TAMBAH */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography fontWeight="bold" mb={2}>
          Tambah Akun Pegawai
        </Typography>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
        >
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              size="small"
              label="Nama Lengkap"
              name="nama"
              value={form.nama}
              onChange={handleChange}
              sx={{ minWidth: 180 }}
            />
            <TextField
              size="small"
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              sx={{ minWidth: 200 }}
            />
            <TextField
              size="small"
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              sx={{ minWidth: 180 }}
            />
            <TextField
              select
              size="small"
              label="Role"
              name="role"
              value={form.role}
              onChange={handleChange}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="pegawai">Pegawai</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Box>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{ height: 40, whiteSpace: "nowrap" }}
          >
            Simpan Akun
          </Button>
        </Box>
      </Paper>

      {/* TABEL */}
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell>No</TableCell>
              <TableCell>Nama</TableCell>
              <TableCell>Email</TableCell>
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
                  <TableCell>{a.email}</TableCell>
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
                          onClick={() => handleDelete(a.id)}
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

      {/* DIALOG EDIT */}
      <Dialog
        open={dialogEdit}
        onClose={() => setDialogEdit(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle fontWeight="bold">Edit Akun</DialogTitle>
        <Divider />
        <DialogContent>
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
                label="Email"
                type="email"
                value={editData.email}
                onChange={(e) =>
                  setEditData({ ...editData, email: e.target.value })
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

              {/* Toggle ganti password */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography fontSize={14} color="text.secondary">
                  Ganti Password
                </Typography>
                <Button
                  size="small"
                  variant={gantiPassword ? "contained" : "outlined"}
                  onClick={() => {
                    setGantiPassword(!gantiPassword);
                    setEditData({ ...editData, password: "" });
                  }}
                >
                  {gantiPassword ? "Batal Ganti" : "Ganti Password"}
                </Button>
              </Box>

              {gantiPassword && (
                <TextField
                  fullWidth
                  size="small"
                  label="Password Baru"
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
          <Button onClick={() => setDialogEdit(false)} variant="outlined">
            Batal
          </Button>
          <Button variant="contained" onClick={handleSimpanEdit}>
            Simpan
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
