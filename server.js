const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

const db = new sqlite3.Database("./bank.db");

// 初期テーブル
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      password TEXT,
      points INTEGER
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO users (id, password, points)
    VALUES ('admin', 'adminpass', 0)
  `);
});

app.post("/login", (req, res) => {
  const { id, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE id = ? AND password = ?",
    [id, password],
    (err, row) => {
      if (row) res.json(row);
      else res.status(401).send("ログイン失敗");
    }
  );
});

app.post("/send", (req, res) => {
  const { from, to, amount } = req.body;

  db.run(
    "UPDATE users SET points = points - ? WHERE id = ?",
    [amount, from]
  );
  db.run(
    "UPDATE users SET points = points + ? WHERE id = ?",
    [amount, to]
  );

  res.send("OK");
});

app.get("/admin", (req, res) => {
  db.all("SELECT * FROM users", (err, rows) => {
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`http://localhost:${port} で起動`);
});

// ユーザー追加（管理者用）
app.post("/create-user", (req, res) => {
  const { id, password } = req.body;

  db.run(
    "INSERT INTO users (id, password, points) VALUES (?, ?, 0)",
    [id, password],
    (err) => {
      if (err) {
        return res.status(400).send("ユーザー作成失敗（ID重複かも）");
      }
      res.send("ユーザー作成成功");
    }
  );
});
``