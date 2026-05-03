import { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DashboardLayoutAdmin from "../../layout/DashboardLayoutAdmin";

export default function DataPegawai() {
  const [pegawai, setPegawai] = useState([]);
  const [search, setSearch] = useState("");
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [notif, setNotif] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ================= GET DATA =================
  const getData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/pegawai");
      setPegawai(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error load pegawai:", err);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  // ================= FILTER SEARCH =================
  const filteredPegawai = pegawai.filter(
    (p) =>
      p.nama?.toLowerCase().includes(search.toLowerCase()) ||
      p.nik?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()),
  );

  // ================= EDIT =================
  const handleOpenEdit = (p) => {
    setEditData({ ...p });
    setOpenEdit(true);
  };

  const handleEdit = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/pegawai/${editData.id}`,
        editData,
      );
      setNotif({
        open: true,
        message: "✅ Data pegawai berhasil diupdate",
        severity: "success",
      });
      setOpenEdit(false);
      getData();
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal mengupdate pegawai";
      setNotif({ open: true, message: msg, severity: "error" });
    }
  };

  return (
    <DashboardLayoutAdmin>
      <Box>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Data Pegawai
        </Typography>

        <Paper sx={{ p: 3, borderRadius: 3 }}>
          {/* HEADER */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
            mb={2}
          >
            <TextField
              placeholder="Cari nama, NIK, atau email..."
              size="small"
              sx={{ flex: 1 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* 🔥 Info — tambah pegawai lewat Manajemen Akun */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                px: 2,
                py: 1,
                backgroundColor: "#e3f2fd",
                borderRadius: 2,
                whiteSpace: "nowrap",
                fontSize: 12,
              }}
            >
              💡 Tambah pegawai melalui menu Manajemen Akun
            </Typography>
          </Box>

          {/* TABLE */}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Nama</TableCell>
                <TableCell>NIK</TableCell>
                <TableCell>No HP</TableCell>
                <TableCell>Email Pribadi</TableCell>
                <TableCell>Alamat</TableCell>
                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredPegawai.length > 0 ? (
                filteredPegawai.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{p.nama}</TableCell>
                    <TableCell>{p.nik || "-"}</TableCell>
                    <TableCell>{p.no_hp || "-"}</TableCell>
                    <TableCell>{p.email || "-"}</TableCell>
                    <TableCell>{p.alamat || "-"}</TableCell>
                    <TableCell align="center">
                      {/* 🔥 Hanya ada Edit, tidak ada Hapus */}
                      <Tooltip title="Edit Data Kontak">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {search ? "Data tidak ditemukan" : "Tidak ada data"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* MODAL EDIT */}
        <Dialog
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Edit Data Kontak Pegawai</DialogTitle>
          <DialogContent>
            {editData && (
              <>
                {/* Nama tidak bisa diubah — sudah dari akun */}
                <TextField
                  fullWidth
                  label="Nama"
                  margin="dense"
                  value={editData.nama}
                  disabled
                  helperText="Nama diatur dari Manajemen Akun"
                />
                <TextField
                  fullWidth
                  label="NIK"
                  margin="dense"
                  value={editData.nik || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, nik: e.target.value })
                  }
                />
                <TextField
                  fullWidth
                  label="No HP"
                  margin="dense"
                  value={editData.no_hp || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, no_hp: e.target.value })
                  }
                />
                <TextField
                  fullWidth
                  label="Email Pribadi"
                  margin="dense"
                  value={editData.email || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                  helperText="Email pribadi pegawai (bukan email login)"
                />
                <TextField
                  fullWidth
                  label="Alamat"
                  margin="dense"
                  multiline
                  rows={3}
                  value={editData.alamat || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, alamat: e.target.value })
                  }
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEdit(false)}>Batal</Button>
            <Button variant="contained" onClick={handleEdit}>
              Update
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
    </DashboardLayoutAdmin>
  );
}
