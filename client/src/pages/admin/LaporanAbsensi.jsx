import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayoutAdmin from "../../layout/DashboardLayoutAdmin";

import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Divider,
} from "@mui/material";

export default function LaporanAbsensi() {
  const [pegawai, setPegawai] = useState([]);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);

  const [form, setForm] = useState({
    pegawai_id: "",
    start: "",
    end: "",
  });

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/pegawai")
      .then((res) => setPegawai(res.data))
      .catch((err) => console.log(err));
  }, []);

  // ── Shortcut periode ──────────────────────────────
  const setMingguIni = () => {
    const now = new Date();
    const day = now.getDay(); // 0=minggu
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    setForm((f) => ({
      ...f,
      start: monday.toISOString().split("T")[0],
      end: sunday.toISOString().split("T")[0],
    }));
  };

  const setBulanIni = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setForm((f) => ({
      ...f,
      start: firstDay.toISOString().split("T")[0],
      end: lastDay.toISOString().split("T")[0],
    }));
  };

  const setBulanLalu = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    setForm((f) => ({
      ...f,
      start: firstDay.toISOString().split("T")[0],
      end: lastDay.toISOString().split("T")[0],
    }));
  };
  // ─────────────────────────────────────────────────

  const handlePreview = async () => {
    if (!form.pegawai_id || !form.start || !form.end) {
      alert("Lengkapi form dulu!");
      return;
    }

    try {
      const res = await axios.get("http://localhost:5000/api/laporan", {
        params: form,
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setData(list);

      // Hitung summary
      const hadir = list.filter((d) => d.status === "Hadir").length;
      const izin = list.filter((d) => d.status === "Izin").length;
      const sakit = list.filter((d) => d.status === "Sakit").length;
      const alpha = list.filter((d) => d.status === "Alpha").length;
      const terlambat = list.filter((d) => d.status === "Terlambat").length;
      setSummary({ hadir, izin, sakit, alpha, terlambat, total: list.length });
    } catch (err) {
      console.error(err);
      alert("Gagal mengambil data laporan");
    }
  };

  const handleDownload = () => {
    if (!form.pegawai_id || !form.start || !form.end) {
      alert("Lengkapi form dulu!");
      return;
    }
    window.open(
      `http://localhost:5000/api/laporan/download?pegawai_id=${form.pegawai_id}&start=${form.start}&end=${form.end}`,
    );
  };

  const getStatusColor = (status) => {
    if (status === "Hadir") return "success";
    if (status === "Terlambat") return "warning";
    if (status === "Sakit") return "info";
    if (status === "Izin") return "default";
    if (status === "Alpha") return "error";
    return "default";
  };

  const namaPegawai = pegawai.find((p) => p.id == form.pegawai_id)?.nama || "";

  return (
    <DashboardLayoutAdmin>
      <Box>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Laporan Absensi
        </Typography>

        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          {/* HEADER */}
          <Typography fontWeight="bold">Buat Laporan Absensi</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Pilih pegawai dan periode
          </Typography>

          {/* SHORTCUT PERIODE */}
          <Box display="flex" gap={1} mb={2}>
            <Button size="small" variant="outlined" onClick={setMingguIni}>
              Minggu Ini
            </Button>
            <Button size="small" variant="outlined" onClick={setBulanIni}>
              Bulan Ini
            </Button>
            <Button size="small" variant="outlined" onClick={setBulanLalu}>
              Bulan Lalu
            </Button>
          </Box>

          {/* FORM */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                select
                size="small"
                label="Pegawai"
                value={form.pegawai_id}
                sx={{ minWidth: 180 }}
                onChange={(e) =>
                  setForm({ ...form, pegawai_id: e.target.value })
                }
              >
                {pegawai.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.nama}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="date"
                size="small"
                label="Dari"
                InputLabelProps={{ shrink: true }}
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />

              <TextField
                type="date"
                size="small"
                label="Sampai"
                InputLabelProps={{ shrink: true }}
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />
            </Box>

            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                onClick={handlePreview}
                sx={{ height: 40 }}
              >
                Preview
              </Button>
              <Button
                variant="outlined"
                onClick={handleDownload}
                sx={{ height: 40 }}
              >
                Download PDF
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* HASIL */}
        {data.length > 0 && summary && (
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            {/* JUDUL REKAP */}
            <Typography fontWeight="bold" mb={1}>
              Rekap Absensi — {namaPegawai}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Periode:{" "}
              {new Date(form.start).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              s/d{" "}
              {new Date(form.end).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {/* SUMMARY CARD */}
            <Box display="flex" gap={2} flexWrap="wrap" mb={3}>
              {[
                {
                  label: "Hadir",
                  value: summary.hadir,
                  color: "#2e7d32",
                  bg: "#e8f5e9",
                },
                {
                  label: "Terlambat",
                  value: summary.terlambat,
                  color: "#e65100",
                  bg: "#fff3e0",
                },
                {
                  label: "Sakit",
                  value: summary.sakit,
                  color: "#0277bd",
                  bg: "#e1f5fe",
                },
                {
                  label: "Izin",
                  value: summary.izin,
                  color: "#555",
                  bg: "#f5f5f5",
                },
              ].map((s) => (
                <Box
                  key={s.label}
                  sx={{
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    backgroundColor: s.bg,
                    minWidth: 100,
                    textAlign: "center",
                  }}
                >
                  <Typography fontSize={22} fontWeight="bold" color={s.color}>
                    {s.value}
                  </Typography>
                  <Typography fontSize={12} color={s.color}>
                    {s.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* TABEL DETAIL */}
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell>No</TableCell>
                  <TableCell>Tanggal</TableCell>
                  <TableCell>Jam Masuk</TableCell>
                  <TableCell>Jam Pulang</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      {new Date(d.tanggal).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{d.jam_masuk || "-"}</TableCell>
                    <TableCell>{d.jam_pulang || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={d.status}
                        color={getStatusColor(d.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* EMPTY STATE */}
        {data.length === 0 && (
          <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
            <Typography color="text.secondary">
              Pilih pegawai dan periode, lalu klik Preview
            </Typography>
          </Paper>
        )}
      </Box>
    </DashboardLayoutAdmin>
  );
}
