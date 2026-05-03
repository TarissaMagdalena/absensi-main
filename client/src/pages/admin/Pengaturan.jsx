import { useState } from "react";
import axios from "axios";
import DashboardLayoutAdmin from "../../layout/DashboardLayoutAdmin";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";

export default function Pengaturan() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setNotif({
        open: true,
        message: "Semua field harus diisi!",
        severity: "warning",
      });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setNotif({
        open: true,
        message: "Password baru tidak sama!",
        severity: "warning",
      });
      return;
    }

    if (form.newPassword.length < 6) {
      setNotif({
        open: true,
        message: "Password minimal 6 karakter!",
        severity: "warning",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await axios.put(
        "http://localhost:5000/api/auth/change-password",
        {
          user_id: user?.id, // 🔥 kirim user_id dari localStorage
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        },
      );

      setNotif({
        open: true,
        message: "✅ Password berhasil diubah!",
        severity: "success",
      });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal update password!";
      setNotif({ open: true, message: msg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayoutAdmin>
      <Box>
        <Paper sx={{ maxWidth: 600, p: 4, borderRadius: 3, mx: "auto", mt: 4 }}>
          <Typography variant="h6" fontWeight="bold" mb={1}>
            Ubah Password
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Pastikan akun Anda menggunakan password yang panjang dan acak agar
            tetap aman.
          </Typography>

          <Typography mb={1}>Password Saat Ini</Typography>
          <TextField
            fullWidth
            type="password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            sx={{ mb: 3 }}
          />

          <Typography mb={1}>Password Baru</Typography>
          <TextField
            fullWidth
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            sx={{ mb: 3 }}
          />

          <Typography mb={1}>Konfirmasi Password Baru</Typography>
          <TextField
            fullWidth
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            sx={{ mb: 3 }}
          />

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              backgroundColor: "#1c2b4a",
              px: 4,
              borderRadius: 2,
              textTransform: "none",
            }}
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </Paper>
      </Box>

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
