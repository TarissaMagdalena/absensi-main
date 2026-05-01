import { useState } from "react";
import DashboardLayoutPegawai from "../../layout/DashboardLayoutPegawai";

import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  InputAdornment,
  IconButton,
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function PengaturanPegawai() {
  const [user, setUser] = useState({
    nama: "Tarissa Magdalena",
    nik: "0987654321111",
    email: "tarissa@email.com",
  });

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

  // 🔥 PASSWORD STRENGTH
  const [strength, setStrength] = useState({
    score: 0,
    label: "",
  });

  const checkStrength = (pass) => {
    let score = 0;

    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    let label = "";
    if (score <= 1) label = "Lemah";
    else if (score <= 3) label = "Sedang";
    else label = "Kuat";

    setStrength({ score, label });
  };

  const togglePassword = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field],
    });
  };

  const handleUpdateProfile = () => {
    alert("Profil berhasil diperbarui");
  };

  const handleUpdatePassword = () => {
    if (!password.current || !password.new || !password.confirm) {
      alert("Semua field wajib diisi");
      return;
    }

    if (password.new !== password.confirm) {
      alert("Password tidak cocok");
      return;
    }

    if (strength.score < 2) {
      alert("Password terlalu lemah");
      return;
    }

    alert("Password berhasil diubah");
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
                value={user.nama}
                disabled
                sx={{ minWidth: 200 }}
              />

              <TextField
                size="small"
                label="NIK"
                value={user.nik}
                disabled
                sx={{ minWidth: 200 }}
              />

              <TextField
                size="small"
                label="Email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                sx={{ minWidth: 220 }}
                helperText="Gunakan email aktif"
              />
            </Box>

            <Button variant="contained" onClick={handleUpdateProfile}>
              Simpan Perubahan
            </Button>
          </Box>
        </Paper>

        {/* ================= PASSWORD ================= */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography fontWeight="bold" mb={2}>
            Ubah Password
          </Typography>

          <Box
            display="flex"
            alignItems="center"
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

                {/* 🔥 STRENGTH BAR */}
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
                    sx={{
                      fontWeight: "bold",
                      color:
                        strength.score <= 1
                          ? "error.main"
                          : strength.score <= 3
                            ? "warning.main"
                            : "success.main",
                    }}
                  >
                    {strength.label}
                  </Typography>
                </Box>
              </Box>

              {/* CONFIRM */}
              <TextField
                size="small"
                type={showPassword.confirm ? "text" : "password"}
                label="Konfirmasi Password"
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
    </DashboardLayoutPegawai>
  );
}
