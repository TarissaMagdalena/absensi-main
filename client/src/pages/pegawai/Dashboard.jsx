import { useState, useEffect } from "react";
import DashboardLayoutPegawai from "../../layout/DashboardLayoutPegawai";
import MapAbsensi from "../../components/MapAbsensi";

import {
  Box,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Chip,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [absenMasuk, setAbsenMasuk] = useState(null);
  const [statusMasuk, setStatusMasuk] = useState("Belum Absen");

  const [absenPulang, setAbsenPulang] = useState(null);
  const [statusPulang, setStatusPulang] = useState("Belum Absen");

  const [showModal, setShowModal] = useState(false);
  const [tipeAbsensi, setTipeAbsensi] = useState("Hadir");
  const [keterangan, setKeterangan] = useState("");

  const [lokasi, setLokasi] = useState(null);
  const [infoLokasi, setInfoLokasi] = useState(null);
  const [aktivitas, setAktivitas] = useState([]);

  const [notif, setNotif] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Sesudah — sama, tapi pastikan tipe juga dicek:
  const bolehAbsenPulang =
    (statusMasuk === "Hadir" || statusMasuk === "Terlambat") &&
    statusMasuk !== "Izin" &&
    statusMasuk !== "Sakit" &&
    statusMasuk !== "Cuti";

  // ================= FETCH ABSENSI HARI INI =================
  useEffect(() => {
    const fetchAbsenHariIni = async () => {
      if (!user?.pegawai_id) return;
      try {
        const res = await fetch(
          `http://localhost:5000/api/absensi/hari-ini?pegawai_id=${user.pegawai_id}`,
        );
        const data = await res.json();
        if (data && data.jam_masuk) {
          setAbsenMasuk(data.jam_masuk);
          setStatusMasuk(data.status);
          setInfoLokasi({ dalamArea: data.status_area === "DALAM" });

          // Tambah ke aktivitas
          setAktivitas((prev) => {
            const sudahAda = prev.find((a) => a.tipe === "masuk");
            if (sudahAda) return prev;
            return [
              {
                id: "masuk-db",
                tipe: "masuk",
                label: "Absen Masuk",
                jam: data.jam_masuk,
                status: data.status,
                keterangan:
                  data.status_area === "DALAM"
                    ? "Dalam Area Kantor"
                    : "Di Luar Area Kantor",
              },
              ...prev,
            ];
          });
        }
        if (data && data.jam_pulang) {
          setAbsenPulang(data.jam_pulang);
          setStatusPulang("Selesai");

          setAktivitas((prev) => {
            const sudahAda = prev.find((a) => a.tipe === "pulang");
            if (sudahAda) return prev;
            return [
              {
                id: "pulang-db",
                tipe: "pulang",
                label: "Absen Pulang",
                jam: data.jam_pulang,
                status: "Selesai",
                keterangan: "Jam pulang tercatat",
              },
              ...prev,
            ];
          });
        }
      } catch (err) {
        console.error("Gagal fetch absen hari ini:", err);
      }
    };
    fetchAbsenHariIni();
  }, []);

  // ================= ABSEN MASUK =================
  const handleSubmitAbsensi = async () => {
    if (!lokasi) {
      setNotif({
        open: true,
        message: "Lokasi belum siap",
        severity: "warning",
      });
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/absensi/masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pegawai_id: user?.pegawai_id,
          lat: lokasi.lat,
          lng: lokasi.lng,
          accuracy: lokasi.accuracy,
          tipe: tipeAbsensi,
          keterangan,
        }),
      });

      const data = await res.json();
      console.log("✅ Response:", res.status, data);

      if (!res.ok) {
        setNotif({ open: true, message: data.message, severity: "warning" });
        setShowModal(false);
        return;
      }

      const jamMasuk =
        data.jam_masuk ||
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Jakarta",
        });

      const statusBaru = data.status || tipeAbsensi;

      setAbsenMasuk(jamMasuk);
      setStatusMasuk(statusBaru);
      setInfoLokasi({ distance: data.distance, dalamArea: data.dalam_area });
      setAktivitas((prev) => [
        {
          id: Date.now(),
          tipe: "masuk",
          label: "Absen Masuk",
          jam: jamMasuk,
          status: statusBaru,
          keterangan: data.dalam_area
            ? "Dalam Area Kantor"
            : "Di Luar Area Kantor",
        },
        ...prev,
      ]);

      setShowModal(false);
      setKeterangan("");
      setNotif({
        open: true,
        message: "✅ Absensi masuk berhasil",
        severity: "success",
      });
    } catch (err) {
      console.error("❌ Error absen masuk:", err);
      setShowModal(false);
      setNotif({
        open: true,
        message: "Gagal terhubung ke server",
        severity: "error",
      });
    }
  };

  // ================= ABSEN PULANG =================
  const handleAbsenPulang = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/absensi/pulang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pegawai_id: user?.pegawai_id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotif({ open: true, message: data.message, severity: "warning" });
        return;
      }

      const jamPulang =
        data.jam_pulang ||
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Jakarta",
        });

      setAbsenPulang(jamPulang);
      setStatusPulang("Selesai");
      setAktivitas((prev) => [
        {
          id: Date.now(),
          tipe: "pulang",
          label: "Absen Pulang",
          jam: jamPulang,
          status: "Selesai",
          keterangan: "Jam pulang tercatat",
        },
        ...prev,
      ]);

      setNotif({
        open: true,
        message: "✅ Absen pulang berhasil",
        severity: "success",
      });
    } catch (err) {
      console.error("❌ Error absen pulang:", err);
      setNotif({
        open: true,
        message: "Gagal terhubung ke server",
        severity: "error",
      });
    }
  };

  const hariIni = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  return (
    <DashboardLayoutPegawai>
      <Box>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Selamat Datang, {user?.nama || "Pegawai"}!
        </Typography>

        <Box display="flex" flexDirection="column" gap={3}>
          {/* MAP */}
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <MapAbsensi onLocation={setLokasi} />
            {lokasi && (
              <Typography fontSize={13} mt={1}>
                📍 Akurasi: ±{Math.round(lokasi.accuracy)} meter
              </Typography>
            )}
            {infoLokasi && (
              <Chip
                label={
                  infoLokasi.dalamArea
                    ? "Dalam Area Kantor"
                    : "Di Luar Area Kantor"
                }
                color={infoLokasi.dalamArea ? "success" : "warning"}
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Paper>

          {/* ABSEN */}
          <Box display="flex" gap={3}>
            {/* MASUK */}
            <Paper
              onClick={() => {
                if (statusMasuk !== "Belum Absen") {
                  setNotif({
                    open: true,
                    message: "Anda sudah absen hari ini",
                    severity: "info",
                  });
                  return;
                }
                setShowModal(true);
              }}
              sx={{
                flex: 1,
                p: 3,
                borderRadius: 3,
                backgroundColor: "#22c55e",
                color: "#fff",
                cursor:
                  statusMasuk === "Belum Absen" ? "pointer" : "not-allowed",
                opacity: statusMasuk === "Belum Absen" ? 1 : 0.6,
              }}
            >
              <Typography>Absen Masuk</Typography>
              <Typography variant="h5" fontWeight="bold">
                {absenMasuk || "Klik untuk Absen"}
              </Typography>
              <Typography>{statusMasuk}</Typography>
            </Paper>

            {/* PULANG */}
            <Paper
              onClick={
                bolehAbsenPulang && !absenPulang ? handleAbsenPulang : null
              }
              sx={{
                flex: 1,
                p: 3,
                borderRadius: 3,
                backgroundColor: "#ef4444",
                color: "#fff",
                opacity: bolehAbsenPulang && !absenPulang ? 1 : 0.5,
                cursor:
                  bolehAbsenPulang && !absenPulang ? "pointer" : "not-allowed",
              }}
            >
              <Typography>Absen Pulang</Typography>
              <Typography variant="h5" fontWeight="bold">
                {bolehAbsenPulang ? absenPulang || "Klik untuk Absen" : "-"}
              </Typography>
              <Typography>
                {bolehAbsenPulang ? statusPulang : "Tidak diperlukan"}
              </Typography>
            </Paper>
          </Box>

          {/* AKTIVITAS HARI INI */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography fontWeight="bold" mb={1}>
              Aktivitas Hari Ini
            </Typography>
            <Typography fontSize={13} color="text.secondary" mb={2}>
              {hariIni}
            </Typography>

            {aktivitas.length === 0 ? (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: "#f5f5f5",
                  textAlign: "center",
                }}
              >
                <Typography color="text.secondary" fontSize={14}>
                  Belum ada aktivitas hari ini
                </Typography>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {aktivitas.map((item, index) => (
                  <Box key={item.id}>
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={2}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor:
                          item.tipe === "masuk" ? "#e8f5e9" : "#fce4ec",
                      }}
                    >
                      {item.tipe === "masuk" ? (
                        <LoginIcon sx={{ color: "#2e7d32" }} />
                      ) : (
                        <LogoutIcon sx={{ color: "#c62828" }} />
                      )}
                      <Box flex={1}>
                        <Typography fontWeight="bold" fontSize={14}>
                          {item.label}
                        </Typography>
                        <Typography fontSize={12} color="text.secondary">
                          {item.keterangan}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography fontWeight="bold" fontSize={14}>
                          {item.jam}
                        </Typography>
                        <Chip
                          label={item.status}
                          size="small"
                          color={
                            item.status === "Hadir"
                              ? "success"
                              : item.status === "Terlambat"
                                ? "warning"
                                : item.status === "Selesai"
                                  ? "info"
                                  : "default"
                          }
                        />
                      </Box>
                    </Box>
                    {index < aktivitas.length - 1 && <Divider />}
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Box>

        {/* MODAL */}
        <Dialog
          open={showModal}
          onClose={() => setShowModal(false)}
          PaperProps={{ sx: { borderRadius: 3, minWidth: 340 } }}
        >
          <DialogTitle sx={{ pb: 1, fontWeight: "bold" }}>
            📋 Absensi Hari Ini
          </DialogTitle>

          <Divider />

          <DialogContent sx={{ pt: 2 }}>
            <Typography fontSize={13} color="text.secondary" mb={2}>
              Pilih tipe kehadiran kamu hari ini
            </Typography>

            {/* PILIHAN TIPE — pakai tombol bukan dropdown */}
            <Box display="flex" flexDirection="column" gap={1.5}>
              {[
                {
                  value: "Hadir",
                  icon: "✅",
                  desc: "Hadir dan bekerja normal",
                },
                {
                  value: "Sakit",
                  icon: "🤒",
                  desc: "Tidak hadir karena sakit",
                },
                { value: "Izin", icon: "📝", desc: "Tidak hadir dengan izin" },
                { value: "Cuti", icon: "🏖️", desc: "Mengambil hari cuti" },
              ].map((item) => (
                <Box
                  key={item.value}
                  onClick={() => {
                    setTipeAbsensi(item.value);
                    setKeterangan("");
                  }}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: "2px solid",
                    borderColor:
                      tipeAbsensi === item.value ? "#1976d2" : "#e0e0e0",
                    backgroundColor:
                      tipeAbsensi === item.value ? "#e3f2fd" : "#fafafa",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: "#1976d2",
                      backgroundColor: "#f0f7ff",
                    },
                  }}
                >
                  <Typography fontSize={22}>{item.icon}</Typography>
                  <Box>
                    <Typography fontWeight="bold" fontSize={14}>
                      {item.value}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      {item.desc}
                    </Typography>
                  </Box>
                  {tipeAbsensi === item.value && (
                    <Box ml="auto">
                      <Typography color="primary" fontWeight="bold">
                        ✓
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>

            {/* Keterangan muncul untuk Sakit/Izin/Cuti */}
            {(tipeAbsensi === "Izin" ||
              tipeAbsensi === "Sakit" ||
              tipeAbsensi === "Cuti") && (
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Keterangan"
                placeholder={
                  tipeAbsensi === "Sakit"
                    ? "Contoh: Demam, flu, dll..."
                    : tipeAbsensi === "Izin"
                      ? "Contoh: Urusan keluarga..."
                      : "Contoh: Cuti tahunan..."
                }
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                sx={{ mt: 2 }}
              />
            )}
          </DialogContent>

          <Divider />

          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => {
                setShowModal(false);
                setKeterangan("");
              }}
              variant="outlined"
              sx={{ borderRadius: 2, flex: 1 }}
            >
              Batal
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitAbsensi}
              sx={{ borderRadius: 2, flex: 1 }}
            >
              Simpan
            </Button>
          </DialogActions>
        </Dialog>

        {/* NOTIF */}
        <Snackbar
          open={notif.open}
          autoHideDuration={3000}
          onClose={() => setNotif({ ...notif, open: false })}
        >
          <Alert severity={notif.severity}>{notif.message}</Alert>
        </Snackbar>
      </Box>
    </DashboardLayoutPegawai>
  );
}
