import { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayoutPegawai from "../../layout/DashboardLayoutPegawai";
import {
  Box,
  Typography,
  Paper,
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
  const user = JSON.parse(localStorage.getItem("user"));

  const [data, setData] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");

  const now = new Date();
  const startDownload = `${now.getFullYear()}-01-01`;
  const endDownload = `${now.getFullYear()}-12-31`;

  // 🔥 Fix — tambah user?.pegawai_id ke dependency array
  useEffect(() => {
    const fetchRiwayat = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/absensi/riwayat/${user?.pegawai_id}`,
        );
        setData(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Gagal ambil riwayat:", err);
      }
    };

    if (user?.pegawai_id) fetchRiwayat();
  }, [user?.pegawai_id]); // 🔥 Fix missing dependency

  const filteredData = data.filter((item) => {
    return (
      (filterStatus ? item.status === filterStatus : true) &&
      (filterTanggal ? item.tanggal?.slice(0, 10) === filterTanggal : true) // 🔥 Fix timezone
    );
  });

  const totalHadir = filteredData.length;
  const totalTerlambat = filteredData.filter(
    (d) => d.status === "Terlambat",
  ).length;
  const totalLuarArea = filteredData.filter(
    (d) => d.status_area === "LUAR",
  ).length;

  // 🔥 Fix timezone — tambah T00:00:00
  const formatTanggal = (tgl) =>
    new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const getStatusColor = (status) => {
    if (status === "Hadir") return "success";
    if (status === "Terlambat") return "warning";
    if (status === "Izin") return "info";
    if (status === "Sakit") return "error";
    return "default";
  };

  return (
    <DashboardLayoutPegawai>
      <Box>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          Riwayat Absensi
        </Typography>

        {/* SUMMARY + FILTER */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
          mb={3}
        >
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
              <MenuItem value="Terlambat">Terlambat</MenuItem>
              <MenuItem value="Izin">Izin</MenuItem>
              <MenuItem value="Sakit">Sakit</MenuItem>
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
              href={`http://localhost:5000/api/laporan/download?pegawai_id=${user?.pegawai_id}&start=${startDownload}&end=${endDownload}`}
              target="_blank"
              sx={{ textTransform: "none", fontWeight: "bold" }}
            >
              ⬇ Download
            </Button>
          </Box>
        </Box>

        {/* TABLE */}
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>No</TableCell>
                <TableCell>Tanggal</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>Jam Masuk</TableCell>
                <TableCell>Jam Pulang</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Area</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <TableRow
                    key={item.id}
                    sx={{ "&:hover": { backgroundColor: "#fafafa" } }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{formatTanggal(item.tanggal)}</TableCell>
                    <TableCell>{item.shift_kode || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.jam_masuk || "-"}
                        color={
                          item.status === "Terlambat" ? "warning" : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.jam_pulang || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status_area || "-"}
                        color={
                          item.status_area === "DALAM" ? "success" : "warning"
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    Tidak ada data absensi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </DashboardLayoutPegawai>
  );
}
