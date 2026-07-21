// ═══════════════════════════════════════════════════════════════
// USER ROUTES — Routing akun login pengguna
// ═══════════════════════════════════════════════════════════════

import express from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

// ── Mapping route → controller function ──────────────────────────────────────
router.get("/", getUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
