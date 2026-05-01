import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayoutAdmin from "../../layout/DashboardLayoutAdmin";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Grid,
} from "@mui/material";

export default function DataAbsensi() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [status, setStatus] = useState("");

  const handleRefresh = () => {
    axios
      .get("http://localhost:5000/api/absensi")
      .then((res) => setData(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/absensi");
        setData(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const formatTanggal = (tgl) => {
    return new Date(tgl).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const filteredData = data.filter((item) => {
    return (
      item.nama?.toLowerCase().includes(search.toLowerCase()) &&
      (tanggal ? item.tanggal?.includes(tanggal) : true) &&
      (status ? item.status === status : true)
    );
  });

  const getStatusColor = (status) => {
    if (status === "Hadir") return "success";
    if (status === "Terlambat") return "warning";
    return "error";
  };

  return (
    <DashboardLayoutAdmin>
      <Box>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Data Absensi
        </Typography>

        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                id="search-nama"
                placeholder="Cari Nama Pegawai"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                id="filter-status"
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="Hadir">Hadir</MenuItem>
                <MenuItem value="Terlambat">Terlambat</MenuItem>
                <MenuItem value="Alpha">Alpha</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                type="date"
                fullWidth
                size="small"
                id="filter-tanggal"
                label="Tanggal"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleRefresh}
                sx={{ height: "40px" }}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>

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
                <TableCell>Area</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.nama}</TableCell>
                    <TableCell>{formatTanggal(item.tanggal)}</TableCell>
                    <TableCell>{item.shift_kode || "-"}</TableCell>
                    <TableCell>{item.jam_masuk || "-"}</TableCell>
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
                  <TableCell colSpan={8} align="center">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </DashboardLayoutAdmin>
  );
}
