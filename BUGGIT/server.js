const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // public files only

// Fake database rows
const fakeRows = [
  { amount: "₹10,499", desc: "Laptop" },
  { amount: "₹1,299", desc: "Accessories" },
  { amount: "₹599", desc: "Online Subscription" }
];

// ---- FIXED QUERY GENERATOR ----
function makeFakeQuery(cardNo) {
  const escaped = cardNo.replace(/'/g, "''");
  return `SELECT * FROM transactions WHERE card_number = '${escaped}';`;
}


const sqliPatterns = [
  "' or '1'='1",
  "\" or \"1\"=\"1",
  "' OR '1'='1",
  "or 1=1",
  "' or 1=1",
  "\" or 1=1"
];

app.get("/history", (req, res) => {
  if (req.query.auth !== "1") {
    return res.status(403).send("Access Denied");
  }

  res.sendFile(path.join(__dirname, "private/history.html"));
});

app.post("/verify", (req, res) => {
  const { cardNo, cvv } = req.body;

  if (!cardNo || !cvv) {
    return res.json({ ok: false, msg: "Please enter card number." });
  }

  console.log("[FAKE QUERY]", makeFakeQuery(cardNo));

  const normalized = cardNo.toLowerCase().replace(/\s+/g, "");

  const matched = sqliPatterns.some(p =>
    normalized.includes(p.replace(/\s+/g, ""))
  );


  if (matched) {
    return res.json({
      ok: true,
      msg: "Verification Successful — Access Granted.",
      rows: fakeRows,
      fakeQuery: makeFakeQuery(cardNo),
      redirect: "/history?auth=1"
    });
  }

  // VALID CARD
  if (cardNo === "4321987654321234" && cvv === "000") {
    return res.json({
      ok: true,
      msg: "Verification Successful — Access Granted.",
      rows: fakeRows,
      fakeQuery: makeFakeQuery(cardNo),
      redirect: "/history?auth=1"
    });
  }

  return res.json({ ok: false, msg: "Invalid card details." });
});

app.listen(3000, () => {
  console.log("BUGGIT running at http://localhost:3000");
});
