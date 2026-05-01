import { useState } from "react";
import DashboardLayoutPegawai from "../../layout/DashboardLayoutPegawai";

import {
  Box,
  Typography,
  Paper,
  Grid,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from "@mui/material";

export default function RiwayatAbsensi() {
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");

  const dataAbsensi = [
    {
      id: 1,
      nama: "Tarissa Magdalena",
      tanggal: "2025-10-13",
      shift: "P",
      jamMasuk: "06:57",
      jamPulang: "16:00",
      status: "Hadir",
      lokasi: "Kantor",
    },
    {
      id: 2,
      nama: "Tarissa Magdalena",
      tanggal: "2025-10-14",
      shift: "P",
      jamMasuk: "08:15",
      jamPulang: "16:00",
      status: "Hadir",
      lokasi: "Luar Area",
    },
  ];

  const isTerlambat = (jamMasuk) => jamMasuk > "07:00";

  const filteredData = dataAbsensi.filter((item) => {
    return (
      (filterStatus ? item.status === filterStatus : true) &&
      (filterTanggal ? item.tanggal === filterTanggal : true)
    );
  });

  const totalHadir = filteredData.filter((d) => d.status === "Hadir").length;
  const totalTerlambat = filteredData.filter((d) =>
    isTerlambat(d.jamMasuk),
  ).length;
  const totalLuarArea = filteredData.filter(
    (d) => d.lokasi === "Luar Area",
  ).length;

  const handleDownload = () => {
    alert("Download laporan (hubungkan ke backend nanti)");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Hadir":
        return "success";
      case "Izin":
        return "warning";
      case "Sakit":
        return "info";
      case "Cuti":
        return "secondary";
      default:
        return "default";
    }
  };

  const getLokasiColor = (lokasi) => {
    return lokasi === "Kantor" ? "success" : "error";
  };

  return (
    <DashboardLayoutPegawai>
      <Box>
        {/* ===== HEADER ===== */}
        <Typography variant="h5" fontWeight="bold" mb={3}>
          Riwayat Absensi
        </Typography>

        {/* ===== SUMMARY ===== */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
          mb={3}
        >
          {/* ===== LEFT: SUMMARY ===== */}
          <Box display="flex" gap={2}>
            <Paper sx={{ p: 2, borderRadius: 3, minWidth: 120 }}>
              <Typography variant="body2">Total Hadir</Typography>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                {totalHadir}
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, borderRadius: 3, minWidth: 120 }}>
              <Typography variant="body2">Terlambat</Typography>
              <Typography variant="h6" color="warning.main" fontWeight="bold">
                {totalTerlambat}
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, borderRadius: 3, minWidth: 120 }}>
              <Typography variant="body2">Luar Area</Typography>
              <Typography variant="h6" color="error.main" fontWeight="bold">
                {totalLuarArea}
              </Typography>
            </Paper>
          </Box>

          {/* ===== RIGHT: FILTER ===== */}
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <Select
              size="small"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              displayEmpty
              sx={{ width: 150 }}
            >
              <MenuItem value="">Filter Status</MenuItem>
              <MenuItem value="Hadir">Hadir</MenuItem>
              <MenuItem value="Izin">Izin</MenuItem>
              <MenuItem value="Sakit">Sakit</MenuItem>
              <MenuItem value="Cuti">Cuti</MenuItem>
            </Select>

            <TextField
              type="date"
              size="small"
              value={filterTanggal}
              onChange={(e) => setFilterTanggal(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 150 }}
            />

            <Button
              variant="contained"
              onClick={handleDownload}
              sx={{
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              ⬇ Download
            </Button>
          </Box>
        </Box>

        {/* ===== TABLE ===== */}
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Nama</TableCell>
                <TableCell>Tanggal</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>Jam Masuk</TableCell>
                <TableCell>Jam Pulang</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Lokasi</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.nama}</TableCell>
                  <TableCell>{item.tanggal}</TableCell>
                  <TableCell>{item.shift}</TableCell>

                  <TableCell>
                    <Chip
                      label={item.jamMasuk}
                      color={isTerlambat(item.jamMasuk) ? "warning" : "default"}
                    />
                  </TableCell>

                  <TableCell>{item.jamPulang}</TableCell>

                  <TableCell>
                    <Chip
                      label={item.status}
                      color={getStatusColor(item.status)}
                    />
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={item.lokasi}
                      color={getLokasiColor(item.lokasi)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredData.length === 0 && (
            <Typography mt={2}>Data tidak ditemukan.</Typography>
          )}
        </Paper>
      </Box>
    </DashboardLayoutPegawai>
  );
}
