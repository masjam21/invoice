const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Setup
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      name TEXT
    )`);

    // Default Admin if not exists
    db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
      if (!row) {
        db.run("INSERT INTO users (username, password, role, name) VALUES ('admin', '123', 'admin', 'Admin Utama')");
      }
    });

    // Items Table
    db.run(`CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price INTEGER,
      buyingPrice INTEGER,
      stock INTEGER
    )`);

    // Invoices Table
    db.run(`CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      date TEXT,
      clientName TEXT,
      items TEXT, -- JSON string
      notes TEXT,
      createdBy TEXT,
      creatorName TEXT,
      updatedAt TEXT
    )`);

    // Store Info Table
    db.run(`CREATE TABLE IF NOT EXISTS store_info (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT,
      address TEXT,
      defaultNotes TEXT
    )`);

    // Initial Store Info if not exists
    db.get("SELECT * FROM store_info WHERE id = 1", (err, row) => {
      if (!row) {
        db.run("INSERT INTO store_info (id, name, address, defaultNotes) VALUES (1, 'USAHA ANDA', 'Alamat Bisnis Anda', 'Terima kasih atas kunjungan Anda!')");
      }
    });
  });
}

// --- API Endpoints ---

// Auth
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      res.json(row);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Users
app.get('/api/users', (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { username, password, role, name } = req.body;
  db.run("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)", [username, password, role, name], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, username, password, role, name });
  });
});

app.put('/api/users/:id', (req, res) => {
  const { username, password, role, name } = req.body;
  db.run("UPDATE users SET username = ?, password = ?, role = ?, name = ? WHERE id = ?", [username, password, role, name, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/users/:id', (req, res) => {
  db.run("DELETE FROM users WHERE id = ?", req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Items
app.get('/api/items', (req, res) => {
  db.all("SELECT * FROM items", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/items', (req, res) => {
  const { name, price, buyingPrice, stock } = req.body;
  db.run("INSERT INTO items (name, price, buyingPrice, stock) VALUES (?, ?, ?, ?)", [name, price, buyingPrice, stock], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, price, buyingPrice, stock });
  });
});

app.put('/api/items/:id', (req, res) => {
  const { name, price, buyingPrice, stock } = req.body;
  db.run("UPDATE items SET name = ?, price = ?, buyingPrice = ?, stock = ? WHERE id = ?", [name, price, buyingPrice, stock, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/items/:id', (req, res) => {
  db.run("DELETE FROM items WHERE id = ?", req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Invoices
app.get('/api/invoices', (req, res) => {
  db.all("SELECT * FROM invoices ORDER BY updatedAt DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse items JSON
    const parsedRows = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items)
    }));
    res.json(parsedRows);
  });
});

app.post('/api/invoices', (req, res) => {
  const { id, date, clientName, items, notes, createdBy, creatorName, updatedAt } = req.body;
  db.run("INSERT INTO invoices (id, date, clientName, items, notes, createdBy, creatorName, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
    [id, date, clientName, JSON.stringify(items), notes, createdBy, creatorName, updatedAt], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.put('/api/invoices/:id', (req, res) => {
  const { date, clientName, items, notes, createdBy, creatorName, updatedAt } = req.body;
  db.run("UPDATE invoices SET date = ?, clientName = ?, items = ?, notes = ?, createdBy = ?, creatorName = ?, updatedAt = ? WHERE id = ?", 
    [date, clientName, JSON.stringify(items), notes, createdBy, creatorName, updatedAt, req.params.id], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/invoices/:id', (req, res) => {
  db.run("DELETE FROM invoices WHERE id = ?", req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Store Info
app.get('/api/store_info', (req, res) => {
  db.get("SELECT * FROM store_info WHERE id = 1", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

app.put('/api/store_info', (req, res) => {
  const { name, address, defaultNotes } = req.body;
  db.run("UPDATE store_info SET name = ?, address = ?, defaultNotes = ? WHERE id = 1", [name, address, defaultNotes], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
