import { useState } from "react";
import axios from "axios";
import DashboardLayoutAdmin from "../../layout/DashboardLayoutAdmin";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

// ─── Konstanta ────────────────────────────────────────────────────────────────
const FORM_INIT = { currentPassword: "", newPassword: "", confirmPassword: "" };
const NOTIF_INIT = { open: false, message: "", severity: "success" };

// Mapping skor kekuatan → warna MUI token dan hex
const STRENGTH_MAP = [
  { label: "Lemah", muiColor: "error.main", hex: "#e53935" },
  { label: "Lemah", muiColor: "error.main", hex: "#e53935" },
  { label: "Sedang", muiColor: "warning.main", hex: "#fbc02d" },
  { label: "Sedang", muiColor: "warning.main", hex: "#fbc02d" },
  { label: "Kuat", muiColor: "success.main", hex: "#43a047" },
];

// ─── Komponen utama ───────────────────────────────────────────────────────────
export default function Pengaturan() {
  // Ambil data user dari localStorage (disimpan saat login)
  const user = JSON.parse(localStorage.getItem("user"));

  const [form, setForm] = useState(FORM_INIT);
  const [notif, setNotif] = useState(NOTIF_INIT);
  const [loading, setLoading] = useState(false);

  // Visibility toggle untuk masing-masing field password
  const [showPw, setShowPw] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Skor kekuatan password (0–4)
  const [strength, setStrength] = useState(0);

  // ── Derived values dari strength ────────────────────────────────────────────
  const {
    label: strengthLabel,
    muiColor: strengthMui,
    hex: strengthHex,
  } = STRENGTH_MAP[strength];

  // ── Helper: tampilkan notifikasi ────────────────────────────────────────────
  const showNotif = (message, severity = "success") =>
    setNotif({ open: true, message, severity });

  const closeNotif = () => setNotif((n) => ({ ...n, open: false }));

  // ── Toggle visibility per field ─────────────────────────────────────────────
  const togglePw = (field) =>
    setShowPw((prev) => ({ ...prev, [field]: !prev[field] }));

  // ── Hitung skor kekuatan password ───────────────────────────────────────────
  const calcStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++; // minimal 8 karakter
    if (/[A-Z]/.test(pass)) score++; // huruf besar
    if (/[0-9]/.test(pass)) score++; // angka
    if (/[^A-Za-z0-9]/.test(pass)) score++; // simbol
    setStrength(score);
  };

  // ── Handle perubahan field form ─────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === "newPassword") calcStrength(value);
  };

  // ── Validasi & submit ganti password ───────────────────────────────────────
  const handleSubmit = async () => {
    const { currentPassword, newPassword, confirmPassword } = form;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotif("Semua field harus diisi!", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotif("Password baru tidak sama!", "warning");
      return;
    }
    if (newPassword.length < 6) {
      showNotif("Password minimal 6 karakter!", "warning");
      return;
    }
    if (strength < 2) {
      showNotif(
        "Password terlalu lemah — tambahkan huruf besar, angka, atau simbol.",
        "warning",
      );
      return;
    }

    try {
      setLoading(true);
      await axios.put("http://localhost:5000/api/auth/change-password", {
        user_id: user?.id,
        currentPassword,
        newPassword,
        confirmPassword,
      });

      showNotif("✅ Password berhasil diubah!");
      setForm(FORM_INIT);
      setStrength(0);
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal update password!";
      showNotif(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayoutAdmin>
      <Box>
        <Paper sx={{ maxWidth: 520, p: 4, borderRadius: 3, mx: "auto", mt: 4 }}>
          {/* Judul */}
          <Typography variant="h6" fontWeight="bold" mb={1}>
            Ubah Password
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Gunakan password yang panjang dan acak agar akun tetap aman.
          </Typography>

          {/* ── Field: Password saat ini ──────────────────────────────────── */}
          <Typography variant="body2" fontWeight={500} mb={0.5}>
            Password Saat Ini
          </Typography>
          <TextField
            fullWidth
            name="currentPassword"
            type={showPw.current ? "text" : "password"}
            value={form.currentPassword}
            onChange={handleChange}
            sx={{ mb: 3 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePw("current")} edge="end">
                    {showPw.current ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* ── Field: Password baru ──────────────────────────────────────── */}
          <Typography variant="body2" fontWeight={500} mb={0.5}>
            Password Baru
          </Typography>
          <TextField
            fullWidth
            name="newPassword"
            type={showPw.new ? "text" : "password"}
            value={form.newPassword}
            onChange={handleChange}
            sx={{ mb: form.newPassword.length > 0 ? 1 : 3 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePw("new")} edge="end">
                    {showPw.new ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* ── Strength bar — muncul hanya saat newPassword terisi ───────── */}
          {form.newPassword.length > 0 && (
            <Box mb={3}>
              {/* Bar progress */}
              <Box
                sx={{
                  height: 6,
                  borderRadius: 5,
                  backgroundColor: "#eee",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    width: `${(strength / 4) * 100}%`,
                    backgroundColor: strengthHex,
                    transition: "width 0.3s ease, background-color 0.3s ease",
                  }}
                />
              </Box>
              {/* Label kekuatan */}
              <Typography
                variant="caption"
                fontWeight="bold"
                color={strengthMui}
              >
                Kekuatan password: {strengthLabel}
              </Typography>
            </Box>
          )}

          {/* ── Field: Konfirmasi password baru ───────────────────────────── */}
          <Typography variant="body2" fontWeight={500} mb={0.5}>
            Konfirmasi Password Baru
          </Typography>
          <TextField
            fullWidth
            name="confirmPassword"
            type={showPw.confirm ? "text" : "password"}
            value={form.confirmPassword}
            onChange={handleChange}
            sx={{ mb: 3 }}
            helperText={
              form.confirmPassword.length > 0
                ? form.confirmPassword === form.newPassword
                  ? "✓ Password cocok"
                  : "✗ Password tidak cocok"
                : ""
            }
            FormHelperTextProps={{
              style: {
                color:
                  form.confirmPassword.length > 0
                    ? form.confirmPassword === form.newPassword
                      ? "#43a047"
                      : "#e53935"
                    : "inherit",
                fontWeight: 500,
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePw("confirm")} edge="end">
                    {showPw.confirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* ── Tombol simpan ─────────────────────────────────────────────── */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              backgroundColor: "#1c2b4a",
              py: 1.2,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: "bold",
              fontSize: 14,
              "&:hover": { backgroundColor: "#2e4a7a" },
            }}
          >
            {loading ? "Menyimpan..." : "Simpan Password"}
          </Button>
        </Paper>
      </Box>

      {/* ── Snackbar notifikasi ──────────────────────────────────────────────── */}
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
