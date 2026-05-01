import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DashboardLayoutAdmin from "../../layout/DashboardLayoutAdmin";
import { usePending } from "./PendingContext";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Snackbar,
  Alert,
  Button,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

export default function Approval() {
  const [data, setData] = useState([]);
  const [notif, setNotif] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const { setPendingCount } = usePending();

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/pengajuan");
      const list = Array.isArray(res.data) ? res.data : [];
      setData(list);
      setPendingCount(list.filter((item) => item.status === "Pending").length);
    } catch {
      console.error("Error load pengajuan");
    }
  }, [setPendingCount]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/pengajuan/${id}/approve`);
      setNotif({
        open: true,
        message: "Pengajuan disetujui",
        severity: "success",
      });
      fetchData();
    } catch {
      setNotif({
        open: true,
        message: "Gagal menyetujui pengajuan",
        severity: "error",
      });
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/pengajuan/${id}/reject`);
      setNotif({
        open: true,
        message: "Pengajuan ditolak",
        severity: "warning",
      });
      fetchData();
    } catch {
      setNotif({
        open: true,
        message: "Gagal menolak pengajuan",
        severity: "error",
      });
    }
  };

  const getStatusColor = (status) => {
    if (status === "Disetujui") return "success";
    if (status === "Ditolak") return "error";
    return "warning";
  };

  const formatTanggal = (tgl) => {
    return new Date(tgl).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <DashboardLayoutAdmin>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Approval Pengajuan
      </Typography>

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell>No</TableCell>
              <TableCell>Nama</TableCell>
              <TableCell>Tipe</TableCell>
              <TableCell>Tanggal</TableCell>
              <TableCell>Keterangan</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data.length > 0 ? (
              data.map((item, index) => (
                <TableRow
                  key={item.id}
                  sx={{ "&:hover": { backgroundColor: "#fafafa" } }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.nama}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.tipe}
                      size="small"
                      color={
                        item.tipe === "Sakit"
                          ? "error"
                          : item.tipe === "Izin"
                            ? "warning"
                            : "info"
                      }
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatTanggal(item.tanggal)}</TableCell>
                  <TableCell>{item.keterangan || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.status}
                      color={getStatusColor(item.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {item.status === "Pending" && (
                      <Box display="flex" justifyContent="center" gap={1}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<CheckCircleOutlineIcon />}
                          onClick={() => handleApprove(item.id)}
                          sx={{
                            backgroundColor: "#2e7d32",
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            "&:hover": { backgroundColor: "#1b5e20" },
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<CancelOutlinedIcon />}
                          onClick={() => handleReject(item.id)}
                          sx={{
                            backgroundColor: "#d32f2f",
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            "&:hover": { backgroundColor: "#b71c1c" },
                          }}
                        >
                          Reject
                        </Button>
                      </Box>
                    )}
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
                  Tidak ada pengajuan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Snackbar
        open={notif.open}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        onClose={() => setNotif({ ...notif, open: false })}
      >
        <Alert
          severity={notif.severity}
          variant="filled"
          onClose={() => setNotif({ ...notif, open: false })}
        >
          {notif.message}
        </Alert>
      </Snackbar>
    </DashboardLayoutAdmin>
  );
}
