// ═══════════════════════════════════════════════════════════════
// LOGIN — Halaman login pintu masuk aplikasi
// ═══════════════════════════════════════════════════════════════
import { useState } from "react";
import { apiFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

// Gaya TextField yang konsisten
const tfSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    backgroundColor: "#f8f9fb",
    "& fieldset": { borderColor: "#e0e3eb", borderWidth: "1.5px" },
    "&:hover fieldset": { borderColor: "#1c2b4a" },
    "&.Mui-focused fieldset": { borderColor: "#1c2b4a" },
  },
  "& .MuiInputBase-input": { padding: "14px 16px" },
};

export default function Login() {
  const navigate = useNavigate();
  const theme = useTheme();
  const _isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ── State form ─────────────────────────────────────────────────
  const [namaPengguna, setNamaPengguna] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Submit form login ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    localStorage.removeItem("user");
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: namaPengguna, password: kataSandi }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login gagal");
        return;
      }
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate(data.user.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ── Background halaman login ────────────────────────────────
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #1c2b4a 0%, #2e4a7a 100%)",
        px: { xs: 5, sm: 0 }, // padding kiri-kanan di mobile — lebih besar = card lebih sempit
      }}
    >
      {/* Brand — di atas card, tampil di semua ukuran */}
      <Typography
        sx={{
          fontSize: { xs: 22, sm: 26 },
          fontWeight: 800,
          color: "white",
          letterSpacing: 1,
          mb: { xs: 2, sm: 3 },
          // Desktop: absolute pojok kiri atas; Mobile: di tengah atas card
          position: { sm: "absolute" },
          top: { sm: 40 },
          left: { sm: 60 },
          textAlign: { xs: "center", sm: "left" },
        }}
      >
        E-Absen
      </Typography>

      {/* Card login di tengah layar */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,
          // Mobile: padding lebih kecil, tidak ada hover lift
          p: { xs: 3, sm: 5 },
          borderRadius: { xs: 3, sm: 4 },
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          background: "rgba(255,255,255,0.97)",
          transition: "transform 0.3s ease",
          "&:hover": { transform: { sm: "translateY(-4px)" } },
        }}
      >
        {/* Icon kunci */}
        <Box display="flex" justifyContent="center" mb={2}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "#1c2b4a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LockOutlinedIcon sx={{ color: "white", fontSize: 28 }} />
          </Box>
        </Box>

        <Typography
          variant="h5"
          fontWeight="bold"
          textAlign="center"
          mb={0.5}
          color="#1c2b4a"
        >
          Selamat Datang!
        </Typography>
        <Typography
          variant="body2"
          textAlign="center"
          color="text.secondary"
          mb={3}
        >
          Masuk ke sistem E-Absen
        </Typography>

        {/* Pesan error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* Nama Pengguna */}
          <Typography mb={1} fontSize={13} fontWeight={600} color="#1c2b4a">
            Nama Pengguna
          </Typography>
          <TextField
            fullWidth
            size="medium"
            placeholder="Masukkan Nama Pengguna"
            value={namaPengguna}
            onChange={(e) => setNamaPengguna(e.target.value)}
            required
            autoComplete="username"
            sx={{ mb: 2.5, ...tfSx }}
          />

          {/* Kata Sandi */}
          <Typography mb={1} fontSize={13} fontWeight={600} color="#1c2b4a">
            Kata Sandi
          </Typography>
          <TextField
            fullWidth
            size="medium"
            placeholder="Masukkan kata sandi"
            type={showPassword ? "text" : "password"}
            value={kataSandi}
            onChange={(e) => setKataSandi(e.target.value)}
            required
            autoComplete="current-password"
            sx={{ mb: 3, ...tfSx }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((p) => !p)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Tombol masuk */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: { xs: 1.3, sm: 1.5 },
              borderRadius: "14px",
              backgroundColor: "#1c2b4a",
              textTransform: "none",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: 0.5,
              boxShadow: "0 4px 15px rgba(28,43,74,0.4)",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: "#263557",
                boxShadow: "0 6px 20px rgba(28,43,74,0.5)",
                transform: "translateY(-1px)",
              },
            }}
          >
            {loading ? "Memuat..." : "Masuk"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
