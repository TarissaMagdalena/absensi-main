import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../utils/api";
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
  Chip,
  Snackbar,
  Alert,
  Divider,
  Skeleton,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventNoteIcon from "@mui/icons-material/EventNote";

const SHIFT_COLORS = {
  P: { bg: "#e3f2fd", color: "#1565c0", border: "#90caf9" },
  PK: { bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
  MR: { bg: "#ede7f6", color: "#4527a0", border: "#b39ddb" },
  MK: { bg: "#fce4ec", color: "#880e4f", border: "#f48fb1" },
  PR: { bg: "#e0f7fa", color: "#00695c", border: "#80deea" },
  CT: { bg: "#fff8e1", color: "#f57f17", border: "#ffe082" },
  L: { bg: "#f5f5f5", color: "#757575", border: "#e0e0e0" },
};

const SHIFT_TIDAK_ABSEN = ["L", "CT"];

export default function Dashboard() {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  const [absenMasuk, setAbsenMasuk] = useState(null);
  const [statusMasuk, setStatusMasuk] = useState("Belum Absen");
  const [absenPulang, setAbsenPulang] = useState(null);
  const [statusPulang, setStatusPulang] = useState("Belum Absen");

  const [showModalMasuk, setShowModalMasuk] = useState(false);
  const [showModalPulang, setShowModalPulang] = useState(false);
  const [loadingMasuk, setLoadingMasuk] = useState(false);
  const [loadingPulang, setLoadingPulang] = useState(false);

  const [lokasi, setLokasi] = useState(null);
  const [aktivitas, setAktivitas] = useState([]);
  const [jadwalHariIni, setJadwalHariIni] = useState(null);
  const [loadingJadwal, setLoadingJadwal] = useState(true);

  const [notif, setNotif] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const bolehAbsenPulang =
    statusMasuk === "Hadir" || statusMasuk === "Terlambat";

  const todayStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });

  const hariIni = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  const pegawaiId = user?.pegawai_id;

  // ================= apiFetch JADWAL =================
  useEffect(() => {
    if (!pegawaiId) return;
    setLoadingJadwal(true);

    apiFetch(
      `http://localhost:5000/api/jadwal/pegawai/${pegawaiId}?tanggal=${todayStr}`,
    )
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => setJadwalHariIni(data))
      .catch(() => setJadwalHariIni(null))
      .finally(() => setLoadingJadwal(false));
  }, [pegawaiId, todayStr]);

  // ================= apiFetch ABSENSI HARI INI =================
  useEffect(() => {
    if (!pegawaiId) return;

    apiFetch(
      `http://localhost:5000/api/absensi/hari-ini?pegawai_id=${pegawaiId}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;

        if (data.jam_masuk) {
          setAbsenMasuk(data.jam_masuk);
          setStatusMasuk(data.status);
          setAktivitas((prev) => {
            if (prev.find((a) => a.tipe === "masuk")) return prev;
            return [
              {
                id: "masuk-db",
                tipe: "masuk",
                label: "Absen Masuk",
                jam: data.jam_masuk,
                status: data.status,
                keterangan:
                  data.keterangan ||
                  (data.status_area === "DALAM"
                    ? "Dalam Area Kantor"
                    : "Di Luar Area Kantor"),
              },
              ...prev,
            ];
          });
        }

        if (data.jam_pulang) {
          setAbsenPulang(data.jam_pulang);
          setStatusPulang("Selesai");
          setAktivitas((prev) => {
            if (prev.find((a) => a.tipe === "pulang")) return prev;
            return [
              {
                id: "pulang-db",
                tipe: "pulang",
                label: "Absen Pulang",
                jam: data.jam_pulang,
                status: "Selesai",
                keterangan: data.keterangan_pulang || "Jam pulang tercatat",
                area: data.status_area_pulang || null,
              },
              ...prev,
            ];
          });
        }
      })
      .catch((err) => console.error("Gagal apiFetch absen hari ini:", err));
  }, [pegawaiId]);

  // ================= ABSEN MASUK =================
  const handleSubmitAbsensi = async () => {
    if (loadingMasuk) return;
    if (!lokasi) {
      setNotif({
        open: true,
        message: "Lokasi belum siap",
        severity: "warning",
      });
      return;
    }

    setLoadingMasuk(true);
    try {
      const res = await apiFetch("http://localhost:5000/api/absensi/masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pegawai_id: pegawaiId,
          lat: lokasi.lat,
          lng: lokasi.lng,
          accuracy: lokasi.accuracy,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setNotif({ open: true, message: data.message, severity: "warning" });
        setShowModalMasuk(false);
        return;
      }

      const jamMasuk =
        data.jam_masuk ||
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Jakarta",
        });
      const statusBaru = data.status || "Hadir";

      setAbsenMasuk(jamMasuk);
      setStatusMasuk(statusBaru);
      setAktivitas((prev) => [
        {
          id: Date.now(),
          tipe: "masuk",
          label: "Absen Masuk",
          jam: jamMasuk,
          status: statusBaru,
          keterangan:
            data.keterangan ||
            (data.dalam_area ? "Dalam Area Kantor" : "Di Luar Area Kantor"),
        },
        ...prev,
      ]);

      setShowModalMasuk(false);
      setNotif({
        open: true,
        message: "✅ Absensi masuk berhasil",
        severity: "success",
      });
    } catch {
      setShowModalMasuk(false);
      setNotif({
        open: true,
        message: "Gagal terhubung ke server",
        severity: "error",
      });
    } finally {
      setLoadingMasuk(false);
    }
  };

  // ── Helper keterangan pulang ──
  const getKeteranganPulang = useCallback(
    (jamPulangAktual) => {
      if (!jamPulangAktual || !jadwalHariIni?.jam_pulang)
        return "Jam pulang tercatat";

      const [hA, mA] = jamPulangAktual.slice(0, 5).split(":").map(Number);
      const menitAktual = hA * 60 + mA;
      const [hS, mS] = jadwalHariIni.jam_pulang
        .slice(0, 5)
        .split(":")
        .map(Number);
      const menitShift = hS * 60 + mS;
      const [hMasuk] = (jadwalHariIni.jam_masuk || "00:00")
        .split(":")
        .map(Number);
      const menitMasuk = hMasuk * 60;
      const isShiftMalam = menitShift < menitMasuk;

      let menitAktualNorm = menitAktual;
      if (isShiftMalam && menitAktual < menitMasuk)
        menitAktualNorm = menitAktual + 1440;
      const menitShiftNorm = isShiftMalam ? menitShift + 1440 : menitShift;
      const selisih = menitAktualNorm - menitShiftNorm;

      if (selisih < -30) {
        const m = Math.abs(selisih);
        return m >= 60
          ? `Pulang lebih awal ${Math.floor(m / 60)} jam ${m % 60} menit`
          : `Pulang lebih awal ${m} menit`;
      }
      if (selisih <= 15) return "Pulang tepat waktu";
      return selisih >= 60
        ? `Lembur ${Math.floor(selisih / 60)} jam ${selisih % 60} menit`
        : `Lembur ${selisih} menit`;
    },
    [jadwalHariIni],
  );

  // ================= ABSEN PULANG =================
  const handleSubmitPulang = async () => {
    if (loadingPulang) return;
    if (!lokasi) {
      setNotif({
        open: true,
        message: "Lokasi belum siap",
        severity: "warning",
      });
      return;
    }

    setLoadingPulang(true);
    try {
      const res = await apiFetch("http://localhost:5000/api/absensi/pulang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pegawai_id: pegawaiId,
          lat: lokasi.lat,
          lng: lokasi.lng,
          accuracy: lokasi.accuracy,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setNotif({ open: true, message: data.message, severity: "warning" });
        setShowModalPulang(false);
        return;
      }

      const jamPulang =
        data.jam_pulang ||
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Jakarta",
        });
      const keteranganPulang =
        data.keterangan_pulang || getKeteranganPulang(jamPulang);

      setAbsenPulang(jamPulang);
      setStatusPulang("Selesai");
      setAktivitas((prev) => [
        {
          id: Date.now(),
          tipe: "pulang",
          label: "Absen Pulang",
          jam: jamPulang,
          status: "Selesai",
          keterangan: keteranganPulang,
          area: data.status_area,
        },
        ...prev,
      ]);

      setShowModalPulang(false);
      setNotif({
        open: true,
        message: `✅ Absen pulang berhasil — ${keteranganPulang}`,
        severity: "success",
      });
    } catch {
      setNotif({
        open: true,
        message: "Gagal terhubung ke server",
        severity: "error",
      });
    } finally {
      setLoadingPulang(false);
    }
  };

  // ── Kartu jadwal shift ──
  const renderKartuJadwal = () => {
    if (loadingJadwal) {
      return (
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Skeleton variant="text" width={160} height={20} />
          <Skeleton
            variant="rectangular"
            height={56}
            sx={{ borderRadius: 2, mt: 1 }}
          />
        </Paper>
      );
    }

    const kode = jadwalHariIni?.shift_kode;
    if (!jadwalHariIni || !kode || SHIFT_TIDAK_ABSEN.includes(kode)) {
      const isLibur = kode === "L";
      const isCuti = kode === "CT";

      return (
        <Paper sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e0e0e0" }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <EventNoteIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography fontSize={13} fontWeight="bold" color="text.secondary">
              Jadwal Shift Hari Ini
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: isCuti ? "#fff8e1" : "#f5f5f5",
              border: isCuti ? "1px solid #ffe082" : "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Typography fontSize={22}>
              {isCuti ? "🏖️" : isLibur ? "🏝️" : "📅"}
            </Typography>
            <Box>
              <Typography
                fontWeight="bold"
                fontSize={14}
                color={isCuti ? "#f57f17" : "#757575"}
              >
                {isCuti
                  ? "Sedang Cuti"
                  : isLibur
                    ? "Hari Libur"
                    : "Tidak Ada Jadwal"}
              </Typography>
              <Typography fontSize={12} color="text.secondary">
                {isCuti
                  ? "Kamu sedang cuti hari ini, absen tidak diperlukan"
                  : isLibur
                    ? "Kamu terjadwal libur hari ini"
                    : "Belum ada jadwal shift yang ditetapkan"}
              </Typography>
            </Box>
          </Box>
        </Paper>
      );
    }

    const c = SHIFT_COLORS[kode] || SHIFT_COLORS["PK"];
    const jm = jadwalHariIni.jam_masuk?.slice(0, 5) || "-";
    const jp = jadwalHariIni.jam_pulang?.slice(0, 5) || "-";

    const now = new Date();
    const [hh, mm] = jm.split(":").map(Number);
    const jamMasukDate = new Date();
    jamMasukDate.setHours(hh, mm, 0, 0);
    const selisihMenit = Math.round((jamMasukDate - now) / 60000);

    const waktuInfo = absenMasuk
      ? "Sudah absen masuk"
      : selisihMenit > 0
        ? `Mulai dalam ${selisihMenit} menit`
        : selisihMenit > -30
          ? "Sedang berlangsung"
          : "Sudah melewati jam masuk";

    return (
      <Paper sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${c.border}` }}>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <EventNoteIcon sx={{ fontSize: 18, color: c.color }} />
          <Typography fontSize={13} fontWeight="bold" color={c.color}>
            Jadwal Shift Hari Ini
          </Typography>
        </Box>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: c.bg,
            border: `1px solid ${c.border}`,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1.5,
              backgroundColor: c.color,
              color: "#fff",
              fontWeight: "bold",
              fontSize: 16,
              minWidth: 44,
              textAlign: "center",
            }}
          >
            {kode}
          </Box>
          <Box flex={1}>
            <Typography fontWeight="bold" fontSize={14} color={c.color}>
              {jadwalHariIni.nama || kode}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5} mt={0.3}>
              <AccessTimeIcon
                sx={{ fontSize: 13, color: c.color, opacity: 0.8 }}
              />
              <Typography fontSize={12} color={c.color} sx={{ opacity: 0.9 }}>
                {jm} – {jp} WIB
              </Typography>
            </Box>
          </Box>
          <Chip
            label={waktuInfo}
            size="small"
            sx={{
              backgroundColor: c.color,
              color: "#fff",
              fontWeight: "bold",
              fontSize: 10,
            }}
          />
        </Box>
      </Paper>
    );
  };

  const shiftButuhAbsen =
    jadwalHariIni && !SHIFT_TIDAK_ABSEN.includes(jadwalHariIni.shift_kode);

  return (
    <DashboardLayoutPegawai>
      <Box>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Selamat Datang, {user?.nama?.split(" ")[0] || "Pegawai"}!
        </Typography>

        <Box display="flex" flexDirection="column" gap={3}>
          {renderKartuJadwal()}

          {/* MAP */}
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <MapAbsensi onLocation={setLokasi} />
          </Paper>

          {/* TOMBOL ABSEN */}
          <Box display="flex" gap={3}>
            {/* MASUK */}
            <Paper
              onClick={() => {
                if (!shiftButuhAbsen) {
                  const kode = jadwalHariIni?.shift_kode;
                  setNotif({
                    open: true,
                    message:
                      kode === "CT"
                        ? "Kamu sedang cuti hari ini, absen tidak diperlukan"
                        : kode === "L"
                          ? "Hari ini kamu terjadwal libur"
                          : "Tidak ada jadwal shift hari ini",
                    severity: "info",
                  });
                  return;
                }
                if (statusMasuk !== "Belum Absen") {
                  setNotif({
                    open: true,
                    message: "Anda sudah absen hari ini",
                    severity: "info",
                  });
                  return;
                }
                setShowModalMasuk(true);
              }}
              sx={{
                flex: 1,
                p: 3,
                borderRadius: 3,
                backgroundColor: "#22c55e",
                color: "#fff",
                cursor:
                  statusMasuk === "Belum Absen" && shiftButuhAbsen
                    ? "pointer"
                    : "not-allowed",
                opacity:
                  statusMasuk === "Belum Absen" && shiftButuhAbsen ? 1 : 0.6,
              }}
            >
              <Typography>Absen Masuk</Typography>
              <Typography variant="h5" fontWeight="bold">
                {absenMasuk || "Klik untuk Absen"}
              </Typography>
              <Typography>{statusMasuk}</Typography>
              {jadwalHariIni?.jam_masuk && shiftButuhAbsen && !absenMasuk && (
                <Typography fontSize={11} sx={{ opacity: 0.85, mt: 0.5 }}>
                  🕐 Jadwal masuk: {jadwalHariIni.jam_masuk.slice(0, 5)} WIB
                </Typography>
              )}
            </Paper>

            {/* PULANG */}
            <Paper
              onClick={() => {
                if (!bolehAbsenPulang || absenPulang) return;
                setShowModalPulang(true);
              }}
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
              {jadwalHariIni?.jam_pulang &&
                shiftButuhAbsen &&
                !absenPulang &&
                bolehAbsenPulang && (
                  <Typography fontSize={11} sx={{ opacity: 0.85, mt: 0.5 }}>
                    🕐 Jadwal pulang: {jadwalHariIni.jam_pulang.slice(0, 5)} WIB
                  </Typography>
                )}
            </Paper>
          </Box>

          {/* AKTIVITAS */}
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
                        {item.area && (
                          <Typography fontSize={12} color="text.secondary">
                            {item.area === "DALAM"
                              ? "Dalam Area Kantor"
                              : "Di Luar Area Kantor"}
                          </Typography>
                        )}
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

        {/* MODAL ABSEN MASUK */}
        <Dialog
          open={showModalMasuk}
          onClose={() => !loadingMasuk && setShowModalMasuk(false)}
          PaperProps={{ sx: { borderRadius: 3, minWidth: 320 } }}
        >
          <DialogTitle sx={{ pb: 1, fontWeight: "bold" }}>
            📋 Konfirmasi Absen Masuk
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 2 }}>
            {jadwalHariIni && shiftButuhAbsen && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor:
                    SHIFT_COLORS[jadwalHariIni.shift_kode]?.bg || "#f5f5f5",
                  border: `1px solid ${SHIFT_COLORS[jadwalHariIni.shift_kode]?.border || "#e0e0e0"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <AccessTimeIcon
                  sx={{
                    fontSize: 18,
                    color: SHIFT_COLORS[jadwalHariIni.shift_kode]?.color,
                  }}
                />
                <Box>
                  <Typography
                    fontSize={12}
                    fontWeight="bold"
                    color={SHIFT_COLORS[jadwalHariIni.shift_kode]?.color}
                  >
                    Shift {jadwalHariIni.shift_kode} — {jadwalHariIni.nama}
                  </Typography>
                  <Typography fontSize={11} color="text.secondary">
                    {jadwalHariIni.jam_masuk?.slice(0, 5)} –{" "}
                    {jadwalHariIni.jam_pulang?.slice(0, 5)} WIB
                  </Typography>
                </Box>
              </Box>
            )}
            <Typography fontSize={13} color="text.secondary">
              Apakah kamu yakin ingin melakukan absen masuk sekarang?
            </Typography>
            {lokasi && (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "#e3f2fd",
                }}
              >
                <Typography fontSize={12} color="#1565c0">
                  📍 Akurasi GPS: ±{Math.round(lokasi.accuracy)} meter
                </Typography>
              </Box>
            )}
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setShowModalMasuk(false)}
              variant="outlined"
              disabled={loadingMasuk}
              sx={{ borderRadius: 2, flex: 1 }}
            >
              Batal
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitAbsensi}
              disabled={loadingMasuk}
              sx={{ borderRadius: 2, flex: 1 }}
            >
              {loadingMasuk ? "Memproses..." : "Absen Masuk"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* MODAL ABSEN PULANG */}
        <Dialog
          open={showModalPulang}
          onClose={() => !loadingPulang && setShowModalPulang(false)}
          PaperProps={{ sx: { borderRadius: 3, minWidth: 320 } }}
        >
          <DialogTitle sx={{ pb: 1, fontWeight: "bold" }}>
            🏠 Konfirmasi Absen Pulang
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 2 }}>
            <Typography fontSize={13} color="text.secondary">
              Apakah kamu yakin ingin melakukan absen pulang sekarang?
            </Typography>
            {jadwalHariIni?.jam_pulang && (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "#fce4ec",
                }}
              >
                <Typography fontSize={12} color="#880e4f">
                  🕐 Jadwal pulang: {jadwalHariIni.jam_pulang.slice(0, 5)} WIB
                </Typography>
              </Box>
            )}
            {lokasi && (
              <Box
                sx={{
                  mt: 1,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "#e3f2fd",
                }}
              >
                <Typography fontSize={12} color="#1565c0">
                  📍 Akurasi GPS: ±{Math.round(lokasi.accuracy)} meter
                </Typography>
              </Box>
            )}
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setShowModalPulang(false)}
              variant="outlined"
              disabled={loadingPulang}
              sx={{ borderRadius: 2, flex: 1 }}
            >
              Batal
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleSubmitPulang}
              disabled={loadingPulang}
              sx={{ borderRadius: 2, flex: 1 }}
            >
              {loadingPulang ? "Memproses..." : "Absen Pulang"}
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
