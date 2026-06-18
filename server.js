const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

// DB接続
mongoose.connect("mongodb+srv://zikkyoshin:Llookeed8@cluster0.fm58jom.mongodb.net/bankDB?retryWrites=true&w=majority")
  .then(() => console.log("DB接続OK"))
  .catch(err => console.log(err));

// モデル
const User = mongoose.model("User", {
  id: String,
  password: String,
  points: Number,
  bannedUntil: Date
});

const History = mongoose.model("History", {
  from: String,
  to: String,
  amount: Number,
  date: String
});

// ユーザー作成
app.post("/create-user", async (req, res) => {
  const { id, password } = req.body;

  const exists = await User.findOne({ id });
  if (exists) return res.send("すでに存在");

  await new User({
    id,
    password,
    points: 0,
    bannedUntil: null
  }).save();

  res.send("作成成功");
});

// ログイン
app.post("/login", async (req, res) => {
  const { id, password } = req.body;

  const user = await User.findOne({ id, password });
  if (!user) return res.status(401).send("失敗");

  if (user.bannedUntil && new Date() < user.bannedUntil) {
    return res.status(403).send("BAN中");
  }

  res.json(user);
});

// 送金
app.post("/send", async (req, res) => {
  const { from, to, amount } = req.body;

  const fromUser = await User.findOne({ id: from });
  const toUser = await User.findOne({ id: to });

  if (!fromUser || !toUser) return res.send("ユーザー不存在");

  if (from !== "admin") {
    if (fromUser.points < amount) return res.send("残高不足");
    fromUser.points -= amount;
    await fromUser.save();
  }

  toUser.points += amount;
  await toUser.save();

  await new History({
    from,
    to,
    amount,
    date: new Date().toLocaleString()
  }).save();

  res.send("送金成功");
});

// ユーザー一覧
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// 削除
app.post("/delete-user", async (req, res) => {
  const { id } = req.body;
  await User.deleteOne({ id });
  res.send("削除成功");
});

// BAN
app.post("/ban", async (req, res) => {
  const { id, days } = req.body;

  const date = new Date();
  date.setDate(date.getDate() + Number(days));

  await User.updateOne({ id }, { bannedUntil: date });

  res.send("BAN完了");
});

// 履歴
app.get("/history", async (req, res) => {
  const data = await History.find();
  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("server running"));
``
