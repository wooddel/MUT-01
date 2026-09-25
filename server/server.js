const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const stkConfig = require("./stkconfig");  // import function 4 stkconfig file
const getAccessToken = require("./accesstoken");  // import function 4 accesstoken file
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
app.use(express.json());

// Enable CORS for frontend web application
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
    return res.status(200).json({});
  }
  next();
});

// Helper: Format phone number into Safaricom format 2547XXXXXXXX or 2541XXXXXXXX
function formatSafaricomPhone(phone) {
  if (!phone) return "";
  let cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  } else if ((cleaned.startsWith("7") || cleaned.startsWith("1")) && cleaned.length === 9) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
}

// STK Push Post Route
app.post("/pay", async (req, res) => {
  const { phone, amount } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required for STK Push" });
  }

  const formattedPhone = formatSafaricomPhone(phone);
  if (!formattedPhone || formattedPhone.length !== 12) {
    return res.status(400).json({ error: "Invalid Safaricom phone number format. Use 07XXXXXXXX, 01XXXXXXXX, or 2547XXXXXXXX." });
  }

  const payAmount = Math.round(Number(amount) || 400);

  try {
    console.log(`[STK Push] Initiating request for ${formattedPhone}, Amount: KES ${payAmount}`);
    const token = await getAccessToken();

    const requestBody = {
      BusinessShortCode: stkConfig.BusinessShortCode,
      Password: stkConfig.Password,
      Timestamp: stkConfig.Timestamp,
      TransactionType: stkConfig.TransactionType,
      Amount: payAmount,
      PartyA: formattedPhone,
      PartyB: stkConfig.PartyB,
      PhoneNumber: formattedPhone,
      CallBackURL: stkConfig.CallBackURL,
      AccountReference: stkConfig.AccountReference,
      TransactionDesc: stkConfig.TransactionDesc
    };

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("[STK Push Success Response]:", response.data);
    res.json(response.data);
  } catch (error) {
    const errorData = error.response?.data || error.message;
    console.error("STK Push error:", errorData);
    res.status(500).json({ 
      error: "Failed to process STK push payment via Safaricom",
      details: errorData 
    });
  }
});

// Callback Route
app.post("/callback", (req, res) => {
  console.log("📲 M-PESA Callback received:", JSON.stringify(req.body, null, 2));
  
  const transactionsFile = path.join(__dirname, "transactions.json");

  let transactions = [];
  if (fs.existsSync(transactionsFile)) {
    try {
      const rawData = fs.readFileSync(transactionsFile);
      transactions = JSON.parse(rawData || "[]");
    } catch (e) {
      transactions = [];
    }
  }

  // Push new callback data
  transactions.push({
    receivedAt: new Date().toISOString(),
    data: req.body
  });

  // Save back to transactions.json
  fs.writeFileSync(transactionsFile, JSON.stringify(transactions, null, 2));

  // Send success response to Safaricom
  res.json({ message: "Callback received successfully" });
});

// Get transactions log endpoint
app.get("/transactions", (req, res) => {
  const transactionsFile = path.join(__dirname, "transactions.json");
  if (fs.existsSync(transactionsFile)) {
    try {
      const rawData = fs.readFileSync(transactionsFile);
      return res.json(JSON.parse(rawData || "[]"));
    } catch (e) {
      return res.json([]);
    }
  }
  res.json([]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Safaricom Billing Server running on http://localhost:${PORT}`));

