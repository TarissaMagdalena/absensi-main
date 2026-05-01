import { useEffect, useState } from "react";
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
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DashboardLayoutAdmin from "../../layout/DashboardLayoutAdmin";

export default function ManajemenAkun() {
  const [akun, setAkun] = useState([]);
  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    role: "pegawai",
  });
  const [notif, setNotif] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ================= GET DATA =================
  const loadAkun = () => {
    fetch("http://localhost:5000/api/users")
      .then((res) => res.json())
      .then((data) => setAkun(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("error akun:", err);
        setAkun([]);
      });
  };

  useEffect(() => {
    loadAkun();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if (!form.nama || !form.email || !form.password) {
      setNotif({
        open: true,
        message: "Lengkapi semua field!",
        severity: "warning",
      });
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotif({ open: true, message: data.message, severity: "error" });
        return;
      }

      setNotif({
        open: true,
        message: "✅ Akun berhasil dibuat!",
        severity: "success",
      });
      setForm({ nama: "", email: "", password: "", role: "pegawai" });
      loadAkun();
    } catch (error) {
      setNotif({
        open: true,
        message: "Gagal terhubung ke server",
        severity: "error",
      });
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus akun ini?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setNotif({ open: true, message: data.message, severity: "error" });
        return;
      }

      setNotif({
        open: true,
        message: "Akun berhasil dihapus",
        severity: "success",
      });
      loadAkun();
    } catch (error) {
      setNotif({
        open: true,
        message: "Gagal menghapus akun",
        severity: "error",
      });
    }
  };

  return (
    <DashboardLayoutAdmin>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Manajemen Akun
      </Typography>

      {/* FORM */}
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
              value={form.email}
              onChange={handleChange}
              sx={{ minWidth: 200 }}
            />
            <TextField
              size="small"
              type="password"
              label="Password"
              name="password"
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

      {/* TABLE */}
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
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
                <TableRow key={a.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{a.nama}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell>
                    {/* 🔥 Chip untuk role */}
                    <Chip
                      label={a.role}
                      size="small"
                      color={a.role === "admin" ? "primary" : "default"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {/* 🔥 Icon hapus konsisten dengan DataPegawai */}
                    <Tooltip title="Hapus">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDelete(a.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Tidak ada data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* NOTIF */}
      <Snackbar
        open={notif.open}
        autoHideDuration={3000}
        onClose={() => setNotif({ ...notif, open: false })}
      >
        <Alert severity={notif.severity}>{notif.message}</Alert>
      </Snackbar>
    </DashboardLayoutAdmin>
  );
}
