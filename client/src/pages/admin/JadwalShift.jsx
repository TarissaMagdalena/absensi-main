import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { apiFetch } from "../../utils/api";
import DashboardLayoutAdmin from "../../layout/DashboardLayoutAdmin";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import SaveIcon from "@mui/icons-material/Save";

// ─── Konstanta ────────────────────────────────────────────────────────────────
const SHIFT_COLORS = {
  P: { bg: "#e3f2fd", color: "#1565c0", border: "#90caf9" },
  PK: { bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
  MR: { bg: "#ede7f6", color: "#4527a0", border: "#b39ddb" },
  MK: { bg: "#fce4ec", color: "#880e4f", border: "#f48fb1" },
  PR: { bg: "#e0f7fa", color: "#00695c", border: "#80deea" },
  CT: { bg: "#fff8e1", color: "#f57f17", border: "#ffe082" },
  L: { bg: "#f5f5f5", color: "#757575", border: "#e0e0e0" },
  "": { bg: "transparent", color: "#bbb", border: "#eee" },
};
const SHIFT_KERJA = ["PK", "MR", "MK", "PR", "CT"];
const NAMA_HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// ─── Helper ───────────────────────────────────────────────────────────────────
const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const formatBulan = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;
const getHariDariTanggal = (tgl) => {
  const [y, m, d] = tgl.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
};

// ─── Generator pola jadwal ────────────────────────────────────────────────────
function generatePolaA(
  jumlahHari,
  urutanShift,
  liburSetiap = 4,
  liburDurasi = 2,
  startOffset = 0,
) {
  const siklus = [];
  let hariKerja = 0,
    shiftIdx = 0;
  const totalKerja = urutanShift.length * 2;
  while (hariKerja < totalKerja) {
    siklus.push(urutanShift[shiftIdx % urutanShift.length]);
    hariKerja++;
    if (hariKerja % liburSetiap === 0 && hariKerja < totalKerja)
      for (let l = 0; l < liburDurasi; l++) siklus.push("L");
    if (hariKerja % 2 === 0) shiftIdx++;
  }
  for (let l = 0; l < liburDurasi; l++) siklus.push("L");
  return Array.from(
    { length: jumlahHari },
    (_, d) => siklus[(startOffset + d) % siklus.length],
  );
}
function generatePolaB(jumlahHari, cycleOffset) {
  return Array.from({ length: jumlahHari }, (_, d) =>
    (cycleOffset + d) % 7 < 5 ? "P" : "L",
  );
}
const defaultConfig = () => ({
  kelompok: "A",
  urutanShift: ["PK", "MR", "MK", "PR"],
  liburSetiap: 4,
  liburDurasi: 2,
  startOffset: 0,
  cycleOffset: 0,
});

// ─── Sub-komponen: input keterangan cuti ──────────────────────────────────────
function KeteranganInput({ value, onChange }) {
  const [local, setLocal] = useState(value);
  return (
    <TextField
      fullWidth
      size="small"
      label="Alasan Cuti *"
      placeholder="Contoh: Cuti tahunan, Cuti menikah, Cuti melahirkan"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onChange(local)}
      multiline
      rows={2}
      autoFocus
    />
  );
}

// ─── Build dropdown items shift ───────────────────────────────────────────────
function buildMenuItems(shiftList) {
  const items = [
    <MenuItem key="__empty__" value="">
      <em style={{ color: "#ccc", fontSize: 11 }}>-</em>
    </MenuItem>,
  ];
  shiftList.forEach((s) => {
    const c = SHIFT_COLORS[s.kode] || SHIFT_COLORS[""];
    const jm = s.jam_masuk?.slice(0, 5) || "";
    const jp = s.jam_pulang?.slice(0, 5) || "";
    items.push(
      <MenuItem key={s.kode} value={s.kode}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            px: 1,
            py: 0.3,
            borderRadius: 1,
            backgroundColor: c.bg,
          }}
        >
          <span style={{ fontWeight: "bold", fontSize: 12, color: c.color }}>
            {s.kode}
          </span>
          <span style={{ fontSize: 10, color: c.color, opacity: 0.85 }}>
            {jm && jp ? `${jm} - ${jp}` : s.nama}
          </span>
        </Box>
      </MenuItem>,
    );
  });
  if (!shiftList.find((s) => s.kode === "L")) {
    items.push(
      <MenuItem key="L" value="L">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            px: 1,
            py: 0.3,
            borderRadius: 1,
            backgroundColor: SHIFT_COLORS.L.bg,
          }}
        >
          <span
            style={{
              fontWeight: "bold",
              fontSize: 12,
              color: SHIFT_COLORS.L.color,
            }}
          >
            L
          </span>
          <span
            style={{ fontSize: 10, color: SHIFT_COLORS.L.color, opacity: 0.85 }}
          >
            Libur
          </span>
        </Box>
      </MenuItem>,
    );
  }
  return items;
}

// ─── Sel shift ────────────────────────────────────────────────────────────────
const ShiftCell = memo(function ShiftCell({
  kode,
  onChange,
  menuItems,
  hari,
  isCtBaru,
  hasKet,
  ketText,
}) {
  const c = SHIFT_COLORS[kode] || SHIFT_COLORS[""];
  return (
    <td
      style={{
        padding: "3px",
        borderRight: "1px solid #f0f0f0",
        borderBottom: "1px solid #f0f0f0",
        background: hari === 0 ? "#fff8f8" : "transparent",
      }}
    >
      <Box position="relative" display="inline-block">
        <Select
          value={kode}
          onChange={(e) => onChange(e.target.value)}
          size="small"
          displayEmpty
          renderValue={(val) =>
            val ? (
              <span style={{ fontWeight: "bold", fontSize: 12 }}>{val}</span>
            ) : (
              <em style={{ color: "#ccc", fontSize: 11 }}>-</em>
            )
          }
          sx={{
            width: 56,
            fontSize: 12,
            fontWeight: "bold",
            backgroundColor: c.bg,
            color: c.color,
            border: `1px solid ${c.border}`,
            borderRadius: 1,
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            "& .MuiSelect-select": {
              padding: "4px 6px",
              paddingRight: "20px !important",
            },
            "& .MuiSelect-icon": { fontSize: 16, right: 2 },
          }}
        >
          {menuItems}
        </Select>
        {isCtBaru && (
          <Tooltip
            title="Keterangan cuti akan diisi saat Simpan"
            placement="top"
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#f57f17",
                border: "1px solid white",
              }}
            />
          </Tooltip>
        )}
        {hasKet && (
          <Tooltip title={ketText} placement="top">
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#2e7d32",
                cursor: "help",
                border: "1px solid white",
              }}
            />
          </Tooltip>
        )}
      </Box>
    </td>
  );
});

// ─── Baris pegawai di grid ────────────────────────────────────────────────────
const ShiftRow = memo(function ShiftRow({
  pegawai,
  pi,
  tanggalList,
  grid,
  changes,
  ketGrid,
  menuItems,
  onCellChange,
}) {
  const bg = pi % 2 === 0 ? "#fff" : "#f8fafc";
  return (
    <tr style={{ background: bg }}>
      <td
        style={{
          position: "sticky",
          left: 0,
          zIndex: 1,
          background: bg,
          padding: "8px 16px",
          fontWeight: "bold",
          fontSize: 13,
          borderRight: "2px solid #e0e0e0",
          borderBottom: "1px solid #f0f0f0",
          whiteSpace: "nowrap",
        }}
      >
        {pegawai.nama}
      </td>
      {tanggalList.map(({ tgl, hari }) => {
        const ctKey = `${pegawai.id}|${tgl}`;
        const kode = grid[pegawai.id]?.[tgl] || "";
        const isCtBaru =
          kode === "CT" && changes[ctKey] === "CT" && !ketGrid[ctKey];
        const hasKet = kode === "CT" && !!ketGrid[ctKey];
        return (
          <ShiftCell
            key={tgl}
            kode={kode}
            onChange={(val) => onCellChange(pegawai.id, tgl, val)}
            menuItems={menuItems}
            hari={hari}
            isCtBaru={isCtBaru}
            hasKet={hasKet}
            ketText={ketGrid[ctKey] || ""}
          />
        );
      })}
    </tr>
  );
});

// ─── Komponen utama ───────────────────────────────────────────────────────────
export default function JadwalShift() {
  const today = new Date();
  const [tahun, setTahun] = useState(today.getFullYear());
  const [bulan, setBulan] = useState(today.getMonth());

  const [pegawaiList, setPegawaiList] = useState([]);
  const [shiftList, setShiftList] = useState([]);
  const [grid, setGrid] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState({});
  const [ketGrid, setKetGrid] = useState({});
  const [suratFiles, setSuratFiles] = useState({});
  const [grupCT, setGrupCT] = useState([]);
  const [jatahCuti, setJatahCuti] = useState({});
  const [terpakaiCuti, setTerpakaiCuti] = useState({});
  const [savingCuti, setSavingCuti] = useState(false);
  const [salinDari, setSalinDari] = useState("");
  const [genConfig, setGenConfig] = useState({});
  const [editShift, setEditShift] = useState(null);

  const [dialogKonfirmasi, setDialogKonfirmasi] = useState(false);
  const [dialogSalin, setDialogSalin] = useState(false);
  const [dialogGen, setDialogGen] = useState(false);
  const [dialogEditShift, setDialogEditShift] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });
  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const menuItems = useMemo(() => buildMenuItems(shiftList), [shiftList]);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadPegawai = async () => {
    const res = await apiFetch("http://localhost:5000/api/pegawai");
    setPegawaiList(await res.json());
  };
  const loadShift = async () => {
    const res = await apiFetch("http://localhost:5000/api/jadwal/shift");
    setShiftList(await res.json());
  };
  const loadJadwal = useCallback(async () => {
    setLoading(true);
    setChanges({});
    setKetGrid({});
    try {
      const res = await apiFetch(
        `http://localhost:5000/api/jadwal?bulan=${formatBulan(tahun, bulan)}`,
      );
      const data = await res.json();
      const newGrid = {},
        newKet = {};
      data.forEach((j) => {
        const id = Number(j.pegawai_id);
        const tgl = j.tanggal?.slice(0, 10);
        if (!newGrid[id]) newGrid[id] = {};
        newGrid[id][tgl] = j.shift_kode;
        if (j.shift_kode === "CT" && j.keterangan)
          newKet[`${id}|${tgl}`] = j.keterangan;
      });
      setGrid(newGrid);
      setKetGrid(newKet);
    } catch {
      showSnackbar("Gagal memuat jadwal", "error");
    } finally {
      setLoading(false);
    }
  }, [tahun, bulan]);

  const loadJatahCuti = useCallback(async () => {
    try {
      const res = await apiFetch(
        `http://localhost:5000/api/cuti?tahun=${tahun}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const mapJ = {},
        mapT = {};
      data.forEach((d) => {
        mapJ[d.pegawai_id] = d.jatah;
        mapT[d.pegawai_id] = d.terpakai ?? 0;
      });
      setJatahCuti(mapJ);
      setTerpakaiCuti(mapT);
    } catch {
      /* silent */
    }
  }, [tahun]);

  useEffect(() => {
    loadPegawai();
    loadShift();
  }, []);
  useEffect(() => {
    loadJadwal();
  }, [loadJadwal]);
  useEffect(() => {
    loadJatahCuti();
  }, [loadJatahCuti]);
  useEffect(() => {
    if (!pegawaiList.length) return;
    setGenConfig((prev) => {
      const next = { ...prev };
      pegawaiList.forEach((p) => {
        if (!next[p.id]) next[p.id] = defaultConfig();
      });
      return next;
    });
  }, [pegawaiList]);

  // ── Edit shift ────────────────────────────────────────────────────────────
  const handleKlikShift = (shift) => {
    setEditShift({
      kode: shift.kode,
      nama: shift.nama || "",
      jam_masuk: shift.jam_masuk?.slice(0, 5) || "",
      jam_pulang: shift.jam_pulang?.slice(0, 5) || "",
    });
    setDialogEditShift(true);
  };
  const handleSimpanShift = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/jadwal/shift/${editShift.kode}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama: editShift.nama,
            jam_masuk: editShift.jam_masuk || null,
            jam_pulang: editShift.jam_pulang || null,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) return showSnackbar(data.message, "error");
      showSnackbar("✅ Jam shift berhasil diupdate");
      setDialogEditShift(false);
      loadShift();
    } catch {
      showSnackbar("Gagal update shift", "error");
    }
  };

  // ── Jatah cuti ────────────────────────────────────────────────────────────
  const handleSaveCuti = async () => {
    setSavingCuti(true);
    try {
      const res = await apiFetch("http://localhost:5000/api/cuti", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tahun,
          data: pegawaiList.map((p) => ({
            pegawai_id: p.id,
            jatah: jatahCuti[p.id] ?? 12,
          })),
        }),
      });
      const result = await res.json();
      if (!res.ok) return showSnackbar(result.message, "error");
      showSnackbar("✅ Jatah cuti berhasil disimpan");
      loadJatahCuti();
    } catch {
      showSnackbar("Gagal menyimpan jatah cuti", "error");
    } finally {
      setSavingCuti(false);
    }
  };

  // ── Handle perubahan sel ──────────────────────────────────────────────────
  const handleChange = useCallback((pegawai_id, tanggal, shift_kode) => {
    const key = `${pegawai_id}|${tanggal}`;
    setGrid((prev) => ({
      ...prev,
      [pegawai_id]: { ...prev[pegawai_id], [tanggal]: shift_kode },
    }));
    setChanges((prev) => ({ ...prev, [key]: shift_kode }));
  }, []);

  // ── Simpan jadwal ─────────────────────────────────────────────────────────
  const handleSave = () => {
    if (Object.keys(changes).length === 0) {
      showSnackbar("Tidak ada perubahan untuk disimpan", "info");
      return;
    }
    const ctBaru = Object.entries(changes)
      .filter(([, k]) => k === "CT")
      .filter(([key]) => !ketGrid[key])
      .map(([key]) => {
        const [pid, tgl] = key.split("|");
        return { pegawai_id: Number(pid), tanggal: tgl };
      });
    if (ctBaru.length > 0) {
      const perPegawai = {};
      ctBaru.forEach(({ pegawai_id, tanggal }) => {
        if (!perPegawai[pegawai_id]) perPegawai[pegawai_id] = [];
        perPegawai[pegawai_id].push(tanggal);
      });
      setGrupCT(
        Object.entries(perPegawai).map(([pid, tglList]) => {
          const sorted = tglList.sort();
          return {
            pegawai_id: Number(pid),
            nama: pegawaiList.find((p) => p.id === Number(pid))?.nama || "",
            tanggalMulai: sorted[0],
            tanggalSelesai: sorted[sorted.length - 1],
            tanggalList: sorted,
            keterangan: "",
          };
        }),
      );
      setDialogKonfirmasi(true);
      return;
    }
    simpanJadwal();
  };

  const simpanJadwal = async (ketMap = {}, suratMap = {}) => {
    setSaving(true);
    const jadwal = Object.entries(changes).map(([key, shift_kode]) => {
      const [pid, tgl] = key.split("|");
      return {
        pegawai_id: Number(pid),
        tanggal: tgl,
        shift_kode,
        keterangan: ketMap[key] ?? ketGrid[key] ?? null,
      };
    });
    try {
      const fd = new FormData();
      fd.append("bulan", formatBulan(tahun, bulan));
      fd.append("jadwal", JSON.stringify(jadwal));
      Object.entries(suratMap).forEach(([key, file]) => {
        if (file) fd.append(`surat_cuti__${key}`, file);
      });
      const res = await apiFetch("http://localhost:5000/api/jadwal/bulk", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) return showSnackbar(data.message, "error");
      setKetGrid((prev) => ({ ...prev, ...ketMap }));
      setChanges({});
      setSuratFiles({});
      let msg = `✅ ${data.total} sel berhasil disimpan`;
      if (data.cuti_ditambah > 0)
        msg += ` · ${data.cuti_ditambah} cuti ditambah`;
      if (data.cuti_dicabut > 0) msg += ` · ${data.cuti_dicabut} cuti dicabut`;
      showSnackbar(msg);
      loadJatahCuti();
    } catch {
      showSnackbar("Gagal menyimpan jadwal", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleKonfirmasiSimpan = () => {
    const ketMap = {},
      suratMap = {};
    grupCT.forEach((g) => {
      g.tanggalList.forEach((tgl) => {
        const key = `${g.pegawai_id}|${tgl}`;
        ketMap[key] = g.keterangan;
        if (suratFiles[g.pegawai_id]) suratMap[key] = suratFiles[g.pegawai_id];
      });
    });
    setDialogKonfirmasi(false);
    simpanJadwal(ketMap, suratMap);
  };

  // ── Generate jadwal ───────────────────────────────────────────────────────
  const handleGenerate = () => {
    const jumlahHari = getDaysInMonth(tahun, bulan);
    const newGrid = { ...grid },
      newChanges = { ...changes };
    pegawaiList.forEach((p) => {
      const cfg = genConfig[p.id];
      if (!cfg) return;
      const shifts =
        cfg.kelompok === "A"
          ? generatePolaA(
              jumlahHari,
              cfg.urutanShift,
              cfg.liburSetiap,
              cfg.liburDurasi,
              cfg.startOffset,
            )
          : generatePolaB(jumlahHari, cfg.cycleOffset);
      if (!newGrid[p.id]) newGrid[p.id] = {};
      shifts.forEach((kode, i) => {
        const tgl = `${tahun}-${String(bulan + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
        newGrid[p.id][tgl] = kode;
        newChanges[`${p.id}|${tgl}`] = kode;
      });
    });
    setGrid(newGrid);
    setChanges(newChanges);
    setDialogGen(false);
    showSnackbar(
      `✅ Jadwal di-generate. Klik Simpan untuk menyimpan ${Object.keys(newChanges).length} perubahan.`,
    );
  };

  // ── Salin bulan ───────────────────────────────────────────────────────────
  const handleSalin = async () => {
    if (!salinDari) return showSnackbar("Pilih bulan sumber dulu", "error");
    try {
      const res = await apiFetch("http://localhost:5000/api/jadwal/salin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dari: salinDari,
          ke: formatBulan(tahun, bulan),
        }),
      });
      const data = await res.json();
      if (!res.ok) return showSnackbar(data.message, "error");
      showSnackbar(data.message);
      setDialogSalin(false);
      loadJadwal();
    } catch {
      showSnackbar("Gagal menyalin jadwal", "error");
    }
  };

  // ── Navigasi bulan ────────────────────────────────────────────────────────
  const prevBulan = () => {
    if (bulan === 0) {
      setBulan(11);
      setTahun((y) => y - 1);
    } else setBulan((b) => b - 1);
  };
  const nextBulan = () => {
    if (bulan === 11) {
      setBulan(0);
      setTahun((y) => y + 1);
    } else setBulan((b) => b + 1);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const jumlahHari = getDaysInMonth(tahun, bulan);
  const tanggalList = useMemo(
    () =>
      Array.from({ length: jumlahHari }, (_, i) => {
        const d = i + 1;
        const tgl = `${tahun}-${String(bulan + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        return { d, tgl, hari: getHariDariTanggal(tgl) };
      }),
    [tahun, bulan, jumlahHari],
  );

  const opsiSalin = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(tahun, bulan - i - 1, 1);
    return {
      value: formatBulan(d.getFullYear(), d.getMonth()),
      label: `${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`,
    };
  });

  const updateCfg = (id, field, val) =>
    setGenConfig((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  const addShiftUrutan = (id) =>
    updateCfg(id, "urutanShift", [...(genConfig[id]?.urutanShift || []), "PK"]);
  const removeShiftUrutan = (id, idx) => {
    const arr = (genConfig[id]?.urutanShift || []).filter((_, i) => i !== idx);
    updateCfg(id, "urutanShift", arr.length ? arr : ["PK"]);
  };
  const changeShiftUrutan = (id, idx, val) => {
    const arr = [...(genConfig[id]?.urutanShift || [])];
    arr[idx] = val;
    updateCfg(id, "urutanShift", arr);
  };
  const previewSiklus = (id) => {
    const cfg = genConfig[id];
    if (!cfg) return [];
    return cfg.kelompok === "B"
      ? generatePolaB(10, cfg.cycleOffset)
      : generatePolaA(
          10,
          cfg.urutanShift,
          cfg.liburSetiap,
          cfg.liburDurasi,
          cfg.startOffset,
        );
  };

  const jumlahChanges = Object.keys(changes).length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayoutAdmin>
      <Box sx={{ overflowX: "hidden" }}>
        {/* ── Header ────────────────────────────────────────────────────── */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Jadwal Shift
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Kelola jadwal shift pegawai per bulan
            </Typography>
          </Box>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<AutoFixHighIcon />}
              onClick={() => setDialogGen(true)}
            >
              Generate Jadwal
            </Button>
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() => setDialogSalin(true)}
            >
              Salin Bulan Lalu
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() =>
                window.open(
                  `http://localhost:5000/api/jadwal/download-pdf?bulan=${formatBulan(tahun, bulan)}`,
                  "_blank",
                )
              }
            >
              Download PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving || jumlahChanges === 0}
            >
              {saving
                ? "Menyimpan..."
                : jumlahChanges > 0
                  ? `Simpan (${jumlahChanges} perubahan)`
                  : "Simpan Jadwal"}
            </Button>
          </Box>
        </Box>

        {/* ── Navigasi bulan + chip shift ───────────────────────────────── */}
        <Paper
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <IconButton onClick={prevBulan}>
            <NavigateBeforeIcon />
          </IconButton>
          <Typography
            variant="h6"
            fontWeight="bold"
            minWidth={200}
            textAlign="center"
          >
            {NAMA_BULAN[bulan]} {tahun}
          </Typography>
          <IconButton onClick={nextBulan}>
            <NavigateNextIcon />
          </IconButton>
          <Box display="flex" gap={1} flexWrap="wrap" ml="auto">
            {shiftList.map((s) => {
              const c = SHIFT_COLORS[s.kode] || SHIFT_COLORS[""];
              const jm = s.jam_masuk?.slice(0, 5) || "";
              const jp = s.jam_pulang?.slice(0, 5) || "";
              return (
                <Tooltip key={s.kode} title="Klik untuk edit jam shift">
                  <Chip
                    label={`${s.kode} - ${s.nama}${jm && jp ? ` · ${jm}–${jp}` : ""}`}
                    size="small"
                    onClick={() => handleKlikShift(s)}
                    sx={{
                      backgroundColor: c.bg,
                      color: c.color,
                      border: `1px solid ${c.border}`,
                      fontWeight: "bold",
                      fontSize: 11,
                      cursor: "pointer",
                      "&:hover": { opacity: 0.8 },
                    }}
                  />
                </Tooltip>
              );
            })}
            {!shiftList.find((s) => s.kode === "L") && (
              <Chip
                label="L - Libur"
                size="small"
                sx={{
                  backgroundColor: SHIFT_COLORS.L.bg,
                  color: SHIFT_COLORS.L.color,
                  border: `1px solid ${SHIFT_COLORS.L.border}`,
                  fontWeight: "bold",
                  fontSize: 11,
                }}
              />
            )}
          </Box>
        </Paper>

        {/* ── Grid jadwal — height fixed, scroll dua arah ── */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
            {/* Box ini yang handle scroll — bukan Paper-nya */}
            <Box sx={{ height: 320, overflow: "auto", overflowY: "auto" }}>
              <table
                style={{ borderCollapse: "collapse", width: "max-content" }}
              >
                <thead>
                  <tr>
                    {/* Kolom Pegawai: sticky kiri + sticky atas */}
                    <th
                      style={{
                        position: "sticky",
                        left: 0,
                        top: 0,
                        zIndex: 3,
                        background: "#1c2b4a",
                        color: "white",
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: "bold",
                        minWidth: 150,
                        borderRight: "2px solid #2e4a7a",
                      }}
                    >
                      Pegawai
                    </th>
                    {/* Header tanggal: sticky atas saja */}
                    {tanggalList.map(({ d, tgl, hari }) => (
                      <th
                        key={tgl}
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                          background:
                            hari === 0
                              ? "#b71c1c"
                              : hari === 6
                                ? "#1565c0"
                                : "#1c2b4a",
                          color: "white",
                          padding: "6px 4px",
                          textAlign: "center",
                          fontSize: 11,
                          minWidth: 62,
                          borderRight: "1px solid #2e4a7a",
                        }}
                      >
                        <div style={{ fontWeight: "bold" }}>{d}</div>
                        <div style={{ opacity: 0.8, fontSize: 10 }}>
                          {NAMA_HARI[hari]}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pegawaiList.map((p, pi) => (
                    <ShiftRow
                      key={p.id}
                      pegawai={p}
                      pi={pi}
                      tanggalList={tanggalList}
                      grid={grid}
                      changes={changes}
                      ketGrid={ketGrid}
                      menuItems={menuItems}
                      onCellChange={handleChange}
                    />
                  ))}
                </tbody>
              </table>
            </Box>
          </Paper>
        )}
      </Box>

      {/* ── Jatah Cuti ──────────────────────────────────────────────────────── */}
      <Paper sx={{ borderRadius: 3, p: 3, mt: 3 }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
          flexWrap="wrap"
          gap={1}
        >
          <Box>
            <Typography fontWeight="bold" fontSize={16}>
              Jatah Cuti {tahun}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Default 12 hari/tahun. Sisa = Jatah − hari cuti terpakai.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveCuti}
            disabled={savingCuti}
            size="small"
          >
            {savingCuti ? "Menyimpan..." : "Simpan Jatah Cuti"}
          </Button>
        </Box>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ background: "#1c2b4a" }}>
              {["Pegawai", "Jatah Cuti (hari)", "Terpakai", "Sisa"].map(
                (h, i) => (
                  <th
                    key={h}
                    style={{
                      color: "white",
                      padding: "10px 16px",
                      fontSize: 13,
                      fontWeight: "bold",
                      textAlign: i === 0 ? "left" : "center",
                      width: i === 0 ? undefined : i === 1 ? 180 : 120,
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {pegawaiList.map((p, pi) => {
              const jatah = jatahCuti[p.id] ?? 12;
              const terpakai = terpakaiCuti[p.id] ?? 0;
              const sisa = jatah - terpakai;
              return (
                <tr
                  key={p.id}
                  style={{ background: pi % 2 === 0 ? "#fff" : "#f8fafc" }}
                >
                  <td
                    style={{
                      padding: "10px 16px",
                      fontWeight: "bold",
                      fontSize: 13,
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    {p.nama}
                  </td>
                  <td
                    style={{
                      padding: "8px 16px",
                      textAlign: "center",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={jatah}
                      onChange={(e) =>
                        setJatahCuti((prev) => ({
                          ...prev,
                          [p.id]: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      style={{
                        width: 80,
                        textAlign: "center",
                        padding: "6px",
                        borderRadius: 6,
                        border: "1px solid #e0e0e0",
                        fontSize: 14,
                        fontWeight: "bold",
                      }}
                    />
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "center",
                      fontSize: 13,
                      fontWeight: "bold",
                      color: terpakai > 0 ? "#e65100" : "#757575",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    {terpakai} hari
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "center",
                      fontSize: 13,
                      fontWeight: "bold",
                      color:
                        sisa < 0
                          ? "#b71c1c"
                          : sisa === 0
                            ? "#757575"
                            : "#2e7d32",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    {sisa < 0 ? `${sisa} (melebihi!)` : `${sisa} hari`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Paper>

      {/* ════════ DIALOG GENERATE ════════ */}
      <Dialog
        open={dialogGen}
        onClose={() => setDialogGen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle fontWeight="bold">
          Generate Jadwal Otomatis — {NAMA_BULAN[bulan]} {tahun}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Atur urutan shift dan pola libur untuk setiap pegawai. Grid akan
            terisi otomatis — masih bisa diedit manual sebelum disimpan.
          </Typography>
          <Box display="flex" gap={2} mb={2} flexWrap="wrap">
            <Paper
              variant="outlined"
              sx={{ p: 1.5, flex: 1, minWidth: 260, borderRadius: 2 }}
            >
              <Typography variant="caption" fontWeight="bold" color="primary">
                Kelompok A — Rotasi custom + libur selang
              </Typography>
              <Typography variant="body2" mt={0.5}>
                Tentukan urutan shift (mis. PK→MR→MK→PR), masing-masing 2 hari,
                lalu L disisipkan setiap N hari kerja.
              </Typography>
            </Paper>
            <Paper
              variant="outlined"
              sx={{ p: 1.5, flex: 1, minWidth: 260, borderRadius: 2 }}
            >
              <Typography
                variant="caption"
                fontWeight="bold"
                color="success.main"
              >
                Kelompok B — Pagi saja (5 kerja 2 libur)
              </Typography>
              <Typography variant="body2" mt={0.5}>
                5 hari P → 2 hari L, berulang. Atur posisi awal siklus.
              </Typography>
            </Paper>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    fontWeight: "bold",
                    fontSize: 12,
                    backgroundColor: "#f5f5f5",
                  },
                }}
              >
                <TableCell sx={{ minWidth: 140 }}>Pegawai</TableCell>
                <TableCell sx={{ minWidth: 80 }}>Kelompok</TableCell>
                <TableCell sx={{ minWidth: 300 }}>Urutan Shift (A)</TableCell>
                <TableCell sx={{ minWidth: 120 }}>Libur setiap (A)</TableCell>
                <TableCell sx={{ minWidth: 110 }}>Durasi libur (A)</TableCell>
                <TableCell sx={{ minWidth: 130 }}>Offset awal (A)</TableCell>
                <TableCell sx={{ minWidth: 150 }}>Posisi siklus (B)</TableCell>
                <TableCell sx={{ minWidth: 180 }}>Preview 10 hari</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pegawaiList.map((p) => {
                const cfg = genConfig[p.id] || defaultConfig();
                const isA = cfg.kelompok === "A";
                const prev = previewSiklus(p.id);
                return (
                  <TableRow
                    key={p.id}
                    sx={{ verticalAlign: "top", "& td": { py: 1.5 } }}
                  >
                    <TableCell sx={{ fontWeight: "bold", fontSize: 12 }}>
                      {p.nama}
                    </TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={cfg.kelompok}
                        onChange={(e) =>
                          updateCfg(p.id, "kelompok", e.target.value)
                        }
                        sx={{ width: 75, fontSize: 12 }}
                      >
                        <MenuItem value="A">A</MenuItem>
                        <MenuItem value="B">B</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Box
                        display="flex"
                        flexWrap="wrap"
                        gap={0.5}
                        alignItems="center"
                      >
                        {cfg.urutanShift.map((s, idx) => {
                          const c = SHIFT_COLORS[s] || SHIFT_COLORS[""];
                          return (
                            <Box
                              key={idx}
                              display="flex"
                              alignItems="center"
                              gap={0.3}
                            >
                              <Select
                                size="small"
                                value={s}
                                disabled={!isA}
                                onChange={(e) =>
                                  changeShiftUrutan(p.id, idx, e.target.value)
                                }
                                sx={{
                                  width: 68,
                                  fontSize: 12,
                                  fontWeight: "bold",
                                  backgroundColor: c.bg,
                                  color: c.color,
                                  border: `1px solid ${c.border}`,
                                  borderRadius: 1,
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    border: "none",
                                  },
                                  "& .MuiSelect-select": {
                                    py: "4px",
                                    pl: "6px",
                                    pr: "20px !important",
                                  },
                                  "& .MuiSelect-icon": {
                                    fontSize: 15,
                                    right: 2,
                                  },
                                }}
                              >
                                {SHIFT_KERJA.map((sk) => {
                                  const sc =
                                    SHIFT_COLORS[sk] || SHIFT_COLORS[""];
                                  return (
                                    <MenuItem key={sk} value={sk}>
                                      <Box
                                        sx={{
                                          px: 0.8,
                                          py: 0.2,
                                          borderRadius: 1,
                                          fontSize: 12,
                                          fontWeight: "bold",
                                          backgroundColor: sc.bg,
                                          color: sc.color,
                                        }}
                                      >
                                        {sk}
                                      </Box>
                                    </MenuItem>
                                  );
                                })}
                              </Select>
                              {isA && cfg.urutanShift.length > 1 && (
                                <IconButton
                                  size="small"
                                  onClick={() => removeShiftUrutan(p.id, idx)}
                                  sx={{ p: 0.3 }}
                                >
                                  <DeleteIcon
                                    sx={{ fontSize: 14, color: "#e53935" }}
                                  />
                                </IconButton>
                              )}
                              {idx < cfg.urutanShift.length - 1 && (
                                <Typography
                                  sx={{ fontSize: 10, color: "#999", mx: 0.2 }}
                                >
                                  →
                                </Typography>
                              )}
                            </Box>
                          );
                        })}
                        {isA && (
                          <IconButton
                            size="small"
                            onClick={() => addShiftUrutan(p.id)}
                            sx={{
                              p: 0.4,
                              ml: 0.5,
                              border: "1px dashed #90caf9",
                              borderRadius: 1,
                            }}
                          >
                            <AddIcon sx={{ fontSize: 14, color: "#1565c0" }} />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        disabled={!isA}
                        value={cfg.liburSetiap}
                        onChange={(e) =>
                          updateCfg(
                            p.id,
                            "liburSetiap",
                            Math.max(1, Number(e.target.value)),
                          )
                        }
                        inputProps={{
                          min: 1,
                          max: 20,
                          style: {
                            fontSize: 12,
                            width: 60,
                            textAlign: "center",
                          },
                        }}
                        helperText="hari kerja"
                        FormHelperTextProps={{
                          style: { fontSize: 10, margin: "2px 0 0 0" },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        disabled={!isA}
                        value={cfg.liburDurasi}
                        onChange={(e) =>
                          updateCfg(
                            p.id,
                            "liburDurasi",
                            Math.max(1, Number(e.target.value)),
                          )
                        }
                        inputProps={{
                          min: 1,
                          max: 7,
                          style: {
                            fontSize: 12,
                            width: 60,
                            textAlign: "center",
                          },
                        }}
                        helperText="hari L"
                        FormHelperTextProps={{
                          style: { fontSize: 10, margin: "2px 0 0 0" },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        disabled={!isA}
                        value={cfg.startOffset}
                        onChange={(e) =>
                          updateCfg(
                            p.id,
                            "startOffset",
                            Math.max(0, Number(e.target.value)),
                          )
                        }
                        inputProps={{
                          min: 0,
                          style: {
                            fontSize: 12,
                            width: 60,
                            textAlign: "center",
                          },
                        }}
                        helperText="hari ke-N siklus"
                        FormHelperTextProps={{
                          style: { fontSize: 10, margin: "2px 0 0 0" },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={cfg.cycleOffset}
                        disabled={isA}
                        onChange={(e) =>
                          updateCfg(p.id, "cycleOffset", Number(e.target.value))
                        }
                        sx={{ width: 145, fontSize: 12 }}
                      >
                        {Array.from({ length: 7 }, (_, i) => (
                          <MenuItem key={i} value={i}>
                            {i < 5
                              ? `Hari ke-${i + 1} (kerja)`
                              : `Hari ke-${i + 1} (libur)`}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.4} flexWrap="wrap">
                        {prev.map((kode, i) => {
                          const c = SHIFT_COLORS[kode] || SHIFT_COLORS[""];
                          return (
                            <Box
                              key={i}
                              sx={{
                                width: 28,
                                height: 22,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 0.5,
                                fontSize: 10,
                                fontWeight: "bold",
                                backgroundColor: c.bg,
                                color: c.color,
                                border: `1px solid ${c.border}`,
                              }}
                            >
                              {kode || "·"}
                            </Box>
                          );
                        })}
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: 9 }}
                      >
                        Tgl 1–10
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogGen(false)}>Batal</Button>
          <Button
            variant="contained"
            startIcon={<AutoFixHighIcon />}
            onClick={handleGenerate}
          >
            Generate Sekarang
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════ DIALOG SALIN ════════ */}
      <Dialog
        open={dialogSalin}
        onClose={() => setDialogSalin(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight="bold">
          Salin Jadwal dari Bulan Lain
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Jadwal bulan{" "}
            <strong>
              {NAMA_BULAN[bulan]} {tahun}
            </strong>{" "}
            akan diganti dengan jadwal dari bulan yang dipilih.
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={salinDari}
              onChange={(e) => setSalinDari(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">
                <em>Pilih bulan sumber</em>
              </MenuItem>
              {opsiSalin.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogSalin(false)}>Batal</Button>
          <Button variant="contained" onClick={handleSalin}>
            Salin Sekarang
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════ DIALOG KONFIRMASI CUTI ════════ */}
      <Dialog
        open={dialogKonfirmasi}
        onClose={() => setDialogKonfirmasi(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight="bold">Keterangan & Surat Cuti</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Terdapat{" "}
            <strong>
              {grupCT.reduce((a, g) => a + g.tanggalList.length, 0)} hari cuti
              baru
            </strong>{" "}
            yang akan disimpan.
          </Typography>
          <Box display="flex" flexDirection="column" gap={3}>
            {grupCT.map((g, i) => {
              const file = suratFiles[g.pegawai_id];
              return (
                <Box
                  key={i}
                  sx={{
                    p: 2,
                    border: "1px solid #ffe082",
                    borderRadius: 2,
                    backgroundColor: "#fff8e1",
                  }}
                >
                  <Typography
                    fontWeight="bold"
                    fontSize={14}
                    mb={0.5}
                    color="#f57f17"
                  >
                    {g.nama}
                  </Typography>
                  <Typography fontSize={13} color="text.secondary" mb={1.5}>
                    {g.tanggalList.length === 1
                      ? `Tanggal: ${g.tanggalMulai}`
                      : `${g.tanggalList.length} hari: ${g.tanggalMulai} s/d ${g.tanggalSelesai}`}
                  </Typography>
                  <KeteranganInput
                    value={g.keterangan}
                    onChange={(val) =>
                      setGrupCT((prev) =>
                        prev.map((item, idx) =>
                          idx === i ? { ...item, keterangan: val } : item,
                        ),
                      )
                    }
                  />
                  <Box mt={2}>
                    <Typography fontSize={13} fontWeight="bold" mb={1}>
                      📎 Surat Cuti *
                    </Typography>
                    {!file ? (
                      <Button
                        component="label"
                        variant="outlined"
                        fullWidth
                        size="small"
                        sx={{
                          borderStyle: "dashed",
                          py: 1.5,
                          color: "#f57f17",
                          borderColor: "#ffe082",
                          "&:hover": {
                            borderColor: "#f57f17",
                            backgroundColor: "#fffde7",
                          },
                        }}
                      >
                        📁 Klik untuk upload surat cuti (JPG/PNG/PDF)
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          hidden
                          onChange={(e) => {
                            const f = e.target.files[0];
                            if (f)
                              setSuratFiles((prev) => ({
                                ...prev,
                                [g.pegawai_id]: f,
                              }));
                          }}
                        />
                      </Button>
                    ) : (
                      <Box
                        sx={{
                          border: "1px solid #ffe082",
                          borderRadius: 2,
                          p: 1.5,
                          backgroundColor: "#fff",
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>📄</span>
                          <Typography fontSize={13} flex={1} noWrap>
                            {file.name}
                          </Typography>
                          <Button
                            size="small"
                            color="error"
                            onClick={() =>
                              setSuratFiles((prev) => {
                                const n = { ...prev };
                                delete n[g.pegawai_id];
                                return n;
                              })
                            }
                          >
                            Hapus
                          </Button>
                        </Box>
                      </Box>
                    )}
                    <Typography fontSize={11} color="text.secondary" mt={0.5}>
                      * Wajib diupload sebagai bukti cuti
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogKonfirmasi(false)}>Batal</Button>
          <Button
            variant="contained"
            onClick={handleKonfirmasiSimpan}
            disabled={
              saving ||
              grupCT.some((g) => !g.keterangan.trim()) ||
              grupCT.some((g) => !suratFiles[g.pegawai_id])
            }
          >
            {saving ? "Menyimpan..." : "Simpan Jadwal"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════ DIALOG EDIT SHIFT ════════ */}
      <Dialog
        open={dialogEditShift}
        onClose={() => setDialogEditShift(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight="bold">
          Edit Jam Shift — {editShift?.kode}
        </DialogTitle>
        <DialogContent dividers>
          {editShift && (
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <TextField
                label="Nama Shift"
                size="small"
                fullWidth
                value={editShift.nama}
                onChange={(e) =>
                  setEditShift({ ...editShift, nama: e.target.value })
                }
              />
              <TextField
                label="Jam Masuk"
                type="time"
                size="small"
                fullWidth
                value={editShift.jam_masuk}
                onChange={(e) =>
                  setEditShift({ ...editShift, jam_masuk: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                helperText={
                  ["L", "CT"].includes(editShift.kode)
                    ? "Shift ini tidak memerlukan jam kerja"
                    : "Format HH:MM"
                }
                disabled={["L", "CT"].includes(editShift.kode)}
              />
              <TextField
                label="Jam Pulang"
                type="time"
                size="small"
                fullWidth
                value={editShift.jam_pulang}
                onChange={(e) =>
                  setEditShift({ ...editShift, jam_pulang: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                helperText="Format HH:MM"
                disabled={["L", "CT"].includes(editShift.kode)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEditShift(false)}>Batal</Button>
          <Button
            variant="contained"
            onClick={handleSimpanShift}
            disabled={["L", "CT"].includes(editShift?.kode)}
          >
            Simpan
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ──────────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={closeSnackbar}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayoutAdmin>
  );
}
