const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

// 仮データ（DBの代わり）
let users = {
  admin: { password: "adminpass", points: 1000 }
};

// ログイン
app.post("/login", (req, res) => {
  const { id, password } = req.body;

  if (users[id] && users[id].password === password) {

