const express = require("express");const express = require bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

mongoose.connect("mongodb+srv://zikkyoshin:Llookeed8@cluster0.fm58jom.mongodb.net/bankDB?retryWrites=true&w=majority");

// モデル
const User = mongoose.model("User", {
  id: String,
  password: String,
  points: Number,
  bannedUntil: String, // ✅ 文字列に統一
  deleted: Boolean
});

const History = mongoose.model("History", {
  from: String,
  to: String,
  amount: Number,
  date: String
});

// 作成
app.post("/create-user", async (req, res) => {
  const { id, password } = req.body;

  const exists = await User.findOne({ id });
  if (exists) return res.send("存在");

  await new User({
    id,
    password,
    points: 0,
    bannedUntil: null,
    deleted: false
  }).save();

  res.send("作成成功");
});

// ✅ 修正済ログイン
app.post("/login", async (req, res) => {
  const { id, password } = req.body;

  const user = await User.findOne({ id, password, deleted: false });
  if (!user) return res.status(401).send("失敗");

  // ✅ BAN判定
  if (user.bannedUntil) {

    // 永久BAN
    if (user.bannedUntil === "permanent") {
      return res.status(403).send("永久BAN");
    }

    // 日付BAN
    const now = new Date();
    const banDate = new Date(user.bannedUntil);

    if (now < banDate) {
      return res.status(403).send("BAN中");
    }
  }

  res.json(user);
});

// 送金
app.post("/send", async (req, res) => {
  const { from, to, amount } = req.body;

  const f = await User.findOne({ id: from });
  const t = await User.findOne({ id: to });

  if (!f || !t) return res.send("エラー");

  if (from !== "admin") {
    if (f.points < amount) return res.send("残高不足");
    f.points -= amount;
    await f.save();
  }

  t.points += amount;
  await t.save();

  await new History({
    from, to, amount,
    date: new Date().toLocaleString()
  }).save();

  res.send("送金成功");
});

// 一覧
app.get("/users", async (req, res) => {
  res.json(await User.find({ deleted: false }));
});

// 削除済み
app.get("/deleted-users", async (req, res) => {
  res.json(await User.find({ deleted: true }));
});

// 削除
app.post("/delete-user", async (req, res) => {
  const { id } = req.body;
  await User.updateOne({ id }, { deleted: true });
  res.send("削除");
});

// 完全削除
app.post("/hard-delete", async (req, res) => {
  const { id } = req.body;
  await User.deleteOne({ id });
  res.send("完全削除");
});

// 復帰
app.post("/restore", async (req, res) => {
  const { id } = req.body;
  await User.updateOne({ id }, { deleted: false });
  res.send("復帰");
});

// ✅ BAN修正
app.post("/ban", async (req, res) => {
  const { id, days } = req.body;

  if (days === "permanent") {
    await User.updateOne({ id }, { bannedUntil: "permanent" });
  } else {
    const d = new Date();
    d.setDate(d.getDate() + Number(days));

    await User.updateOne({ id }, { bannedUntil: d.toISOString() }); // ✅文字列保存
  }

  res.send("BAN");
});

// BAN解除
app.post("/unban", async (req, res) => {
  const { id } = req.body;
  await User.updateOne({ id }, { bannedUntil: null });
  res.send("解除");
});

// 履歴
app.get("/history", async (req, res) => {
  res.json(await History.find());
});

app.listen(3000, () => console.log("server running"));
