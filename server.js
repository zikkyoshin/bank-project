const express = require("express");
const bodyParser = require("body-parser");
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
  bannedUntil: String,
  deleted: Boolean
});

// ✅ 起動時に全員BAN解除
(async () => {
  await User.updateMany({}, { bannedUntil: null });
  console.log("✅ 全ユーザーBAN解除完了");
})();

// ログイン
app.post("/login", async (req, res) => {
  const { id, password } = req.body;

  const user = await User.findOne({ id, password });
  if (!user) return res.status(401).send("失敗");

  if (user.bannedUntil === "permanent") {
    return res.status(403).send("永久BAN");
  }

  if (user.bannedUntil) {
    const now = new Date();
    const banDate = new Date(user.bannedUntil);

    if (now < banDate) {
      return res.status(403).send("BAN中");
    }
  }

  res.json(user);
});

app.listen(3000, () => console.log("server running"));
