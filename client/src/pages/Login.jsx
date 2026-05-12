import { useState } from "react";
import { apiFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  Paper,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

export default function Login() {
  const navigate = useNavigate();

  const [namaPengguna, setNamaPengguna] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    localStorage.removeItem("user"); // hapus sesi lama sebelum login baru
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: namaPengguna,
          password: kataSandi,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login gagal");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        // gradient background
        background: "linear-gradient(135deg, #1c2b4a 0%, #2e4a7a 100%)",
      }}
    >
      {/* BRAND */}
      <Typography
        sx={{
          position: "absolute",
          top: 40,
          left: 60,
          fontSize: 26,
          fontWeight: 800,
          color: "white",
          letterSpacing: 1,
        }}
      >
        E-Absen
      </Typography>

      {/* CARD */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 5,
          borderRadius: 4,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          // efek glassmorphism ringan
          background: "rgba(255,255,255,0.97)",
          transition: "transform 0.3s ease",
          "&:hover": {
            transform: "translateY(-4px)",
          },
        }}
      >
        {/* ICON */}
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

        {/* ERROR */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* NAMA PENGGUNA */}
          <Typography mb={1} fontSize={13} fontWeight={600} color="#1c2b4a">
            Nama Pengguna
          </Typography>
          <TextField
            fullWidth
            size="medium"
            id="nama-pengguna"
            placeholder="Masukkan email"
            value={namaPengguna}
            onChange={(e) => setNamaPengguna(e.target.value)}
            required
            sx={{
              mb: 2.5,
              "& .MuiOutlinedInput-root": {
                borderRadius: "14px",
                backgroundColor: "#f8f9fb",
                "& fieldset": { borderColor: "#e0e3eb", borderWidth: "1.5px" },
                "&:hover fieldset": { borderColor: "#1c2b4a" },
                "&.Mui-focused fieldset": { borderColor: "#1c2b4a" },
              },
              "& .MuiInputBase-input": { padding: "14px 16px" },
            }}
          />

          {/* KATA SANDI */}
          <Typography mb={1} fontSize={13} fontWeight={600} color="#1c2b4a">
            Kata Sandi
          </Typography>
          <TextField
            fullWidth
            size="medium"
            id="kata-sandi"
            placeholder="Masukkan kata sandi"
            type={showPassword ? "text" : "password"}
            value={kataSandi}
            onChange={(e) => setKataSandi(e.target.value)}
            required
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: "14px",
                backgroundColor: "#f8f9fb",
                "& fieldset": { borderColor: "#e0e3eb", borderWidth: "1.5px" },
                "&:hover fieldset": { borderColor: "#1c2b4a" },
                "&.Mui-focused fieldset": { borderColor: "#1c2b4a" },
              },
              "& .MuiInputBase-input": { padding: "14px 16px" },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* BUTTON */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.5,
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
