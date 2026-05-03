import { useState, useMemo } from "react";
import DashboardLayoutPegawai from "../../layout/DashboardLayoutPegawai";

import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  Snackbar,
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function PengaturanPegawai() {
  // 🔥 Ambil data user dari localStorage
  const user = useMemo(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [strength, setStrength] = useState({ score: 0, label: "" });

  // 🔥 Snackbar feedback
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const checkStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    const label = score <= 1 ? "Lemah" : score <= 3 ? "Sedang" : "Kuat";
    setStrength({ score, label });
  };

  const togglePassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // 🔥 Ganti password ke API
  const handleUpdatePassword = async () => {
    if (!password.current || !password.new || !password.confirm) {
      return showSnackbar("Semua field wajib diisi", "error");
    }
    if (password.new !== password.confirm) {
      return showSnackbar("Konfirmasi password tidak cocok", "error");
    }
    if (strength.score < 2) {
      return showSnackbar("Password terlalu lemah", "error");
    }

    try {
      const res = await fetch(
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

      if (!res.ok) {
        return showSnackbar(data.message || "Gagal mengubah password", "error");
      }

      setPassword({ current: "", new: "", confirm: "" });
      setStrength({ score: 0, label: "" });
      showSnackbar("Password berhasil diubah");
    } catch {
      showSnackbar("Gagal terhubung ke server", "error");
    }
  };

  return (
    <DashboardLayoutPegawai>
      <Box>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          Pengaturan Akun
        </Typography>

        {/* ================= PROFILE ================= */}
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography fontWeight="bold" mb={2}>
            Informasi Akun
          </Typography>

          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              size="small"
              label="Nama Lengkap"
              value={user?.nama || "-"}
              disabled
              sx={{ minWidth: 200 }}
            />
            <TextField
              size="small"
              label="NIK"
              value={user?.nik || "-"}
              disabled
              sx={{ minWidth: 200 }}
            />
            <TextField
              size="small"
              label="Email"
              value={user?.email || "-"}
              disabled
              sx={{ minWidth: 220 }}
              helperText="Email tidak dapat diubah"
            />
          </Box>
        </Paper>

        {/* ================= PASSWORD ================= */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography fontWeight="bold" mb={2}>
            Ubah Password
          </Typography>

          <Box
            display="flex"
            alignItems="flex-start"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={2}
          >
            <Box display="flex" gap={2} flexWrap="wrap">
              {/* CURRENT */}
              <TextField
                size="small"
                type={showPassword.current ? "text" : "password"}
                label="Password Saat Ini"
                value={password.current}
                sx={{ minWidth: 200 }}
                onChange={(e) =>
                  setPassword({ ...password, current: e.target.value })
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => togglePassword("current")}>
                        {showPassword.current ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* NEW */}
              <Box>
                <TextField
                  size="small"
                  type={showPassword.new ? "text" : "password"}
                  label="Password Baru"
                  value={password.new}
                  sx={{ minWidth: 200 }}
                  onChange={(e) => {
                    setPassword({ ...password, new: e.target.value });
                    checkStrength(e.target.value);
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => togglePassword("new")}>
                          {showPassword.new ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* STRENGTH BAR */}
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
                          width: `${(strength.score / 4) * 100}%`,
                          backgroundColor:
                            strength.score <= 1
                              ? "#e53935"
                              : strength.score <= 3
                                ? "#fbc02d"
                                : "#43a047",
                          transition: "0.3s",
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      color={
                        strength.score <= 1
                          ? "error.main"
                          : strength.score <= 3
                            ? "warning.main"
                            : "success.main"
                      }
                    >
                      {strength.label}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* CONFIRM */}
              <TextField
                size="small"
                type={showPassword.confirm ? "text" : "password"}
                label="Konfirmasi Password"
                value={password.confirm}
                sx={{ minWidth: 200 }}
                onChange={(e) =>
                  setPassword({ ...password, confirm: e.target.value })
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => togglePassword("confirm")}>
                        {showPassword.confirm ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Button
              variant="contained"
              color="secondary"
              onClick={handleUpdatePassword}
            >
              Update Password
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* 🔥 SNACKBAR FEEDBACK */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayoutPegawai>
  );
}
