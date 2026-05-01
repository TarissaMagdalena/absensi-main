import { useState } from "react";
import axios from "axios";
import DashboardLayoutAdmin from "../../layout/DashboardLayoutAdmin";
import { Box, Typography, Paper, TextField, Button } from "@mui/material";

export default function Pengaturan() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      alert("Semua field harus diisi!");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      alert("Password baru tidak sama!");
      return;
    }

    try {
      setLoading(true);
      await axios.put("http://localhost:5000/api/auth/change-password", form);
      alert("Password berhasil diubah!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.log(err);
      alert("Gagal update password!");
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
    </DashboardLayoutAdmin>
  );
}
