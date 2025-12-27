require("dotenv").config();

const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
const fetch = (typeof global.fetch !== 'undefined') ? global.fetch : require('node-fetch');
const questionId = process.env.QUESTION_ID || 1;
app.use(express.static(path.join(__dirname, "public"))); 
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

async function forwardResult(teamcode) {
  const store = await fetch("https://buggit-backend-yy8i.onrender.com/api/store-result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamcode, questionId })
  });
  return await store.json();
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

app.post("/verify", async (req, res) => {
  const { cardNo, cvv,teamcode } = req.body;

  if (!cardNo || !cvv) {
    return res.json({ ok: false, msg: "Please enter card number." });
  }

  console.log("[FAKE QUERY]", makeFakeQuery(cardNo));

  const normalized = cardNo.toLowerCase().replace(/\s+/g, "");

  const matched = sqliPatterns.some(p =>
    normalized.includes(p.replace(/\s+/g, ""))
  );


  if (matched) {
    const teamcode = req.body.teamcode || req.query.teamcode || 'unknown';
    try {
      // const result = await forwardResult(teamcode);
      // console.log("Stored in Main Backend:", result);
      return res.json({
        ok: true,
        msg: "Verification Successful — Access Granted.",
        rows: fakeRows,
        fakeQuery: makeFakeQuery(cardNo),
        redirect: "/history?auth=1",
        resultFromMainServer: result
      });
    } catch (error) {
      console.error("Error contacting main backend:", error);
      return res.status(500).json({ message: "Failed to sync with main backend" });
    }
  }

  // VALID CARD
  if (cardNo === "4321987654321234" && cvv === "000") {
    const teamcode = req.body.teamcode || req.query.teamcode || 'unknown';
    try {
      console.log("➡️ Valid card used from teamcode:", teamcode);
      const result = await forwardResult(teamcode);
      console.log("Stored in Main Backend:", result);
      return res.json({
        ok: true,
        msg: "Verification Successful — Access Granted.",
        rows: fakeRows,
        fakeQuery: makeFakeQuery(cardNo),
        redirect: "https://bug-hunt-manager-tau.vercel.app/dashboard",
        resultFromMainServer: result
      });
    } catch (error) {
      console.error("Error contacting main backend:", error);
      return res.status(500).json({ message: "Failed to sync with main backend" });
    }
  }

  return res.json({ ok: false, msg: "Invalid card details." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});