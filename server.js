const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());
//app.use(express.static("public"));

let users = {
  admin: { password: "adminpass", points: 1000 }
};

app.post("/login", (req, res) => {
  const { id, password } = req.body;

  if (users[id] && users[id].password === password) {
    res.json({ message: "ログイン成功", user: id });
  } else {
    res.status(401).send("ログイン失敗");
  }
});

app.post("/send", (req, res) => {
  const { from, to, amount } = req.body;

  if (!users[from] || !users[to]) {
    return res.status(400).send("ユーザー存在しない");
  }

  if (users[from].points < amount) {
    return res.status(400).send("残高不足");
  }

  users[from].points -= amount;
  users[to].points += amount;

  res.send("送金成功");
});

app.get("/admin", (req, res) => {
  res.json(users);
});

app.post("/create-user", (req, res) => {
  const { id, password } = req.body;

  if (users[id]) {
    return res.status(400).send("すでに存在する");
  }

  users[id] = { password, points: 0 };

  res.send("ユーザー作成成功");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("server running");
});
