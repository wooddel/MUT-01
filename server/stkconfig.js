const moment = require("moment");
const dotenv = require("dotenv");
dotenv.config();

/**
 * stkconfig.js - Configuration and helper for Safaricom Daraja STK Push
 */
module.exports = {
  get BusinessShortCode() {
    return process.env.MPESA_SHORTCODE || "174379";
  },
  get Passkey() {
    return process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
  },
  get Timestamp() {
    return moment().format("YYYYMMDDHHmmss");
  },
  get Password() {
    const shortCode = this.BusinessShortCode;
    const passkey = this.Passkey;
    const timestamp = this.Timestamp;
    return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");
  },
  TransactionType: "CustomerPayBillOnline",
  get PartyB() {
    return this.BusinessShortCode;
  },
  get CallBackURL() {
    return process.env.MPESA_CALLBACK_URL || "https://mydomain.com/callback";
  },
  AccountReference: "MUT House Hunter",
  TransactionDesc: "Visiting Fee Payment"
};
