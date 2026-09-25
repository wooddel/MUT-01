const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

/**
 * accesstoken.js - Fetches Safaricom Daraja API OAuth access token
 */
async function getAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY || "cQO32N2cGlWq5XJ3bX2p02X2p02X2p02";
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET || "X2p02X2p02X2p02X";
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Error fetching Safaricom access token:", error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || "Failed to authenticate with Safaricom Daraja API");
  }
}

module.exports = getAccessToken;
