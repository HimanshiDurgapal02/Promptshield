// Node/Express API: serves stored scan results to React and can start a new scan.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const { execFile } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "promptshield",
});

// All past scans, newest first
app.get("/api/runs", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM scan_runs ORDER BY id DESC LIMIT 20");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Every attack result of one scan
app.get("/api/runs/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT attack_id, category, name, prompt, response, leaked, layer FROM attack_results WHERE run_id = ? ORDER BY id",
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Latest "weak" scan vs latest "defended" scan, with per-category numbers
app.get("/api/compare", async (req, res) => {
  try {
    const out = {};
    for (const mode of ["weak", "defended"]) {
      const [runs] = await pool.query(
        "SELECT * FROM scan_runs WHERE mode = ? ORDER BY id DESC LIMIT 1",
        [mode]
      );
      if (!runs.length) { out[mode] = null; continue; }
      const [cats] = await pool.query(
        "SELECT category, COUNT(*) AS total, SUM(leaked) AS leaked FROM attack_results WHERE run_id = ? GROUP BY category",
        [runs[0].id]
      );
      out[mode] = {
        ...runs[0],
        categories: cats.map((c) => ({ category: c.category, total: Number(c.total), leaked: Number(c.leaked) })),
      };
    }
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start a new scan by running the Python scanner
app.post("/api/scan", (req, res) => {
  const mode = req.body.mode;
  if (!["weak", "defended"].includes(mode)) {
    return res.status(400).json({ error: "mode must be 'weak' or 'defended'" });
  }
  const python = process.env.PYTHON_BIN || "python";
  const script = path.join(__dirname, "..", "scanner", "runner.py");
  execFile(python, [script, mode], { timeout: 180000 }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || err.message });
    res.json({ ok: true, output: stdout });
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`PromptShield API running on http://localhost:${port}`));
