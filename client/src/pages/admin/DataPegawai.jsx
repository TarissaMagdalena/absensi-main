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
import DeleteIcon from "@mui/icons-material/Delete";
import DashboardLayoutAdmin from "../../layout/DashboardLayoutAdmin";

export default function DataPegawai() {
  const [pegawai, setPegawai] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [notif, setNotif] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [form, setForm] = useState({
    nama: "",
    nik: "",
    no_hp: "",
    email: "",
    alamat: "",
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

  // ================= TAMBAH =================
  const handleSubmit = async () => {
    if (!form.nama || !form.nik) {
      setNotif({
        open: true,
        message: "Nama dan NIK wajib diisi",
        severity: "warning",
      });
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/pegawai", form);
      setNotif({
        open: true,
        message: "✅ Pegawai berhasil ditambahkan",
        severity: "success",
      });
      setOpen(false);
      setForm({ nama: "", nik: "", no_hp: "", email: "", alamat: "" });
      getData();
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menambahkan pegawai";
      setNotif({ open: true, message: msg, severity: "error" });
    }
  };

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

  // ================= HAPUS =================
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus pegawai ini?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/pegawai/${id}`);
      setNotif({
        open: true,
        message: "Pegawai berhasil dihapus",
        severity: "success",
      });
      getData();
    } catch (err) {
      setNotif({
        open: true,
        message: "Gagal menghapus pegawai",
        severity: "error",
      });
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
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <TextField
              placeholder="Cari nama, NIK, atau email..."
              size="small"
              sx={{ flex: 1 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              variant="contained"
              sx={{ whiteSpace: "nowrap" }}
              onClick={() => setOpen(true)}
            >
              + Tambah Pegawai
            </Button>
          </Box>

          {/* TABLE */}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Nama</TableCell>
                <TableCell>NIK</TableCell>
                <TableCell>No HP</TableCell>
                <TableCell>Email</TableCell>
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
                    <TableCell>{p.nik}</TableCell>
                    <TableCell>{p.no_hp}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>{p.alamat}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Hapus">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(p.id)}
                        >
                          <DeleteIcon fontSize="small" />
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

        {/* MODAL TAMBAH */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Tambah Pegawai</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Nama"
              margin="dense"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
            />
            <TextField
              fullWidth
              label="NIK"
              margin="dense"
              value={form.nik}
              onChange={(e) => setForm({ ...form, nik: e.target.value })}
            />
            <TextField
              fullWidth
              label="No HP"
              margin="dense"
              value={form.no_hp}
              onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
            />
            <TextField
              fullWidth
              label="Email"
              margin="dense"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              fullWidth
              label="Alamat"
              margin="dense"
              multiline
              rows={3}
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Batal</Button>
            <Button variant="contained" onClick={handleSubmit}>
              Simpan
            </Button>
          </DialogActions>
        </Dialog>

        {/* MODAL EDIT */}
        <Dialog
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Edit Pegawai</DialogTitle>
          <DialogContent>
            {editData && (
              <>
                <TextField
                  fullWidth
                  label="Nama"
                  margin="dense"
                  value={editData.nama}
                  onChange={(e) =>
                    setEditData({ ...editData, nama: e.target.value })
                  }
                />
                <TextField
                  fullWidth
                  label="NIK"
                  margin="dense"
                  value={editData.nik}
                  onChange={(e) =>
                    setEditData({ ...editData, nik: e.target.value })
                  }
                />
                <TextField
                  fullWidth
                  label="No HP"
                  margin="dense"
                  value={editData.no_hp}
                  onChange={(e) =>
                    setEditData({ ...editData, no_hp: e.target.value })
                  }
                />
                <TextField
                  fullWidth
                  label="Email"
                  margin="dense"
                  value={editData.email}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                />
                <TextField
                  fullWidth
                  label="Alamat"
                  margin="dense"
                  multiline
                  rows={3}
                  value={editData.alamat}
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
