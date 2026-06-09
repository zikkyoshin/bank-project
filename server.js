const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.use(bodyParser.json());

app.use(express.static("public"));
// ✅ MongoDB接続
mongoose.connect("mongodb+srv://zikkyoshin:Llookeed8@cluster0.fm58jom.mongodb.net/bankDB?retryWrites=true&w=majority")
  .then(() => console.log("DB接続OK"))
  .catch(err => console.log(err));

// ✅ ユーザーモデル
const User = mongoose.model("User", {
  id: String,
  password: String,
  points: Number
});

// ✅ トップページ
app.get("/", (req, res) => {
  res.send("銀行アプリ動いてる🔥");
});

// ✅ ユーザー作成
app.post("/create-user", async (req, res) => {
  const { id, password } = req.body;

  const existingUser = await User.findOne({ id });
  if (existingUser) {
    return res.status(400).send("すでに存在する");
  }

  const user = new User({
    id,
    password,
    points: 0
  });

  await user.save();

  res.send("ユーザー作成成功");
});

// ✅ ログイン
app.post("/login", async (req, res) => {
  const { id, password } = req.body;

  const user = await User.findOne({ id, password });

  if (user) {
    res.json(user);
  } else {
    res.status(401).send("ログイン失敗");
  }
});

// ✅ 送金
app.post("/send", async (req, res) => {
  const { from, to, amount } = req.body;

  const fromUser = await User.findOne({ id: from });
  const toUser = await User.findOne({ id: to });

  if (!fromUser || !toUser) {
    return res.status(400).send("ユーザー存在しない");
  }

  if (fromUser.points < amount) {
    return res.status(400).send("残高不足");
  }

  fromUser.points -= amount;
  toUser.points += amount;

  await fromUser.save();
  await toUser.save();

  res.send("送金成功");
});

// ✅ 管理者一覧
app.get("/admin", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("server running");
});
