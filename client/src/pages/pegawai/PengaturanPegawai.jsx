import { useState, useMemo } from "react";
import { apiFetch } from "../../utils/api";
import DashboardLayoutPegawai from "../../layout/DashboardLayoutPegawai";
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
const STRENGTH_MAP = [
  { label: "Lemah", color: "error.main", hex: "#e53935" },
  { label: "Lemah", color: "error.main", hex: "#e53935" },
  { label: "Sedang", color: "warning.main", hex: "#fbc02d" },
  { label: "Sedang", color: "warning.main", hex: "#fbc02d" },
  { label: "Kuat", color: "success.main", hex: "#43a047" },
];
const PW_INIT = { current: "", new: "", confirm: "" };
const SHOW_INIT = { current: false, new: false, confirm: false };

// ─── Komponen utama ───────────────────────────────────────────────────────────
export default function PengaturanPegawai() {
  const user = useMemo(() => {
    const s = localStorage.getItem("user");
    return s ? JSON.parse(s) : null;
  }, []);

  const [showPw, setShowPw] = useState(SHOW_INIT);
  const [password, setPassword] = useState(PW_INIT);
  const [strength, setStrength] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });
  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const togglePw = (field) => setShowPw((p) => ({ ...p, [field]: !p[field] }));

  // Hitung skor kekuatan password
  const calcStrength = (pass) => {
    let s = 0;
    if (pass.length >= 8) s++;
    if (/[A-Z]/.test(pass)) s++;
    if (/[0-9]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;
    setStrength(s);
  };

  const {
    label: strengthLabel,
    color: strengthColor,
    hex: strengthHex,
  } = STRENGTH_MAP[strength];

  // Ganti password
  const handleUpdatePassword = async () => {
    if (!password.current || !password.new || !password.confirm)
      return showSnackbar("Semua field wajib diisi", "error");
    if (password.new !== password.confirm)
      return showSnackbar("Konfirmasi password tidak cocok", "error");
    if (strength < 2) return showSnackbar("Kata sandi terlalu lemah", "error");

    try {
      const res = await apiFetch(
        "http://localhost:5000/api/auth/change-password",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user?.id,
            currentPassword: password.current,
            newPassword: password.new,
            confirmPassword: password.confirm,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok)
        return showSnackbar(data.message || "Gagal mengubah password", "error");
      setPassword(PW_INIT);
      setStrength(0);
      showSnackbar("✅ Kata sandi berhasil diubah");
    } catch {
      showSnackbar("Gagal terhubung ke server", "error");
    }
  };

  // Helper: adornment toggle visibilitas password
  const pwAdornment = (field) => (
    <InputAdornment position="end">
      <IconButton onClick={() => togglePw(field)} edge="end">
        {showPw[field] ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayoutPegawai>
      <Box>
        <Typography variant="h5" fontWeight="bold">
          Pengaturan Akun
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Perbarui kata sandi akun Anda secara berkala untuk keamanan
        </Typography>

        {/* ── Informasi Akun ─────────────────────────────────────────────── */}
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Box mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Informasi Akun
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Data akun dikelola oleh admin dan tidak dapat diubah secara
              mandiri.
            </Typography>
          </Box>

          {/* Mobile: stack vertikal | Desktop: horizontal */}
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            gap={2}
            flexWrap="wrap"
          >
            <TextField
              size="small"
              label="Nama Lengkap"
              value={user?.nama || "-"}
              disabled
              fullWidth={true}
              sx={{ flex: 1, minWidth: { sm: 180 } }}
            />
            <TextField
              size="small"
              label="NIK"
              value={user?.nik || "Belum tersedia"}
              disabled
              fullWidth={true}
              sx={{ flex: 1, minWidth: { sm: 140 } }}
            />
            <TextField
              size="small"
              label="Nama Pengguna"
              value={user?.email || "-"}
              disabled
              helperText="Nama Pengguna tidak dapat diubah"
              fullWidth={true}
              sx={{ flex: 1, minWidth: { sm: 200 } }}
            />
          </Box>
        </Paper>

        {/* ── Ubah Kata Sandi ────────────────────────────────────────────── */}
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Box mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Ubah Kata Sandi
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Gunakan kata sandi yang kuat untuk menjaga keamanan akun mandiri.
            </Typography>
          </Box>

          {/* Semua field stack vertikal di mobile, horizontal di desktop */}
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            gap={2}
            flexWrap="wrap"
            mb={2}
          >
            {/* Kata sandi saat ini */}
            <TextField
              size="small"
              label="Kata Sandi Saat Ini"
              type={showPw.current ? "text" : "password"}
              value={password.current}
              onChange={(e) =>
                setPassword({ ...password, current: e.target.value })
              }
              fullWidth={true}
              sx={{ flex: 1, minWidth: { sm: 180 } }}
              InputProps={{ endAdornment: pwAdornment("current") }}
            />

            {/* Kata sandi baru + strength bar */}
            <Box sx={{ flex: 1, minWidth: { sm: 180 } }}>
              <TextField
                fullWidth
                size="small"
                label="Kata Sandi Baru"
                type={showPw.new ? "text" : "password"}
                value={password.new}
                onChange={(e) => {
                  setPassword({ ...password, new: e.target.value });
                  calcStrength(e.target.value);
                }}
                InputProps={{ endAdornment: pwAdornment("new") }}
              />
              {/* Strength bar — muncul saat field terisi */}
              {password.new.length > 0 && (
                <Box mt={1}>
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
                        transition: "0.3s",
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color={strengthColor}
                  >
                    {strengthLabel}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Konfirmasi kata sandi */}
            <TextField
              size="small"
              label="Konfirmasi Kata Sandi Baru"
              type={showPw.confirm ? "text" : "password"}
              value={password.confirm}
              onChange={(e) =>
                setPassword({ ...password, confirm: e.target.value })
              }
              fullWidth={true}
              sx={{ flex: 1, minWidth: { sm: 180 } }}
              InputProps={{ endAdornment: pwAdornment("confirm") }}
              helperText={
                password.confirm.length > 0
                  ? password.confirm === password.new
                    ? "✓ Password cocok"
                    : "✗ Password tidak cocok"
                  : ""
              }
              FormHelperTextProps={{
                style: {
                  color:
                    password.confirm.length > 0
                      ? password.confirm === password.new
                        ? "#43a047"
                        : "#e53935"
                      : "inherit",
                  fontWeight: 500,
                },
              }}
            />
          </Box>

          {/* Tombol — full width di mobile, auto di desktop */}
          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="secondary"
              onClick={handleUpdatePassword}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                px: 3,
              }}
            >
              Perbarui Kata Sandi
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* ── Snackbar ──────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={closeSnackbar}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayoutPegawai>
  );
}
