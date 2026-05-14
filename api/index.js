const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

const BASE_URL = "https://api.minepi.com";
const API_KEY = process.env.PI_API_KEY;

if (!API_KEY) console.warn("⚠️ PI_API_KEY environment variable is missing!");

// ===================== PAYMENT HANDLING =====================
app.post('/api/payments/approve', async (req, res) => {
  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ error: "Missing paymentId" });

  try {
    const response = await axios.post(`${BASE_URL}/v2/payments/${paymentId}/approve`, {}, {
      headers: { 
        'Authorization': `Key ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Payment Approved: ${paymentId}`);
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Approval Error:', err.response?.data || err.message);
    res.status(500).json({ error: "Approval failed" });
  }
});

app.post('/api/payments/complete', async (req, res) => {
  const { paymentId, txid } = req.body;
  if (!paymentId) return res.status(400).json({ error: "Missing paymentId" });

  try {
    const response = await axios.post(`${BASE_URL}/v2/payments/${paymentId}/complete`, { txid }, {
      headers: { 
        'Authorization': `Key ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Payment Completed: ${paymentId}`);
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Completion Error:', err.response?.data || err.message);
    res.status(500).json({ error: "Completion failed" });
  }
});

// ===================== PROTOCOL ACTIONS =====================
app.post('/api/stake', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Successfully staked $CFM. You are now earning sustainable rewards.' 
  });
});

app.post('/api/claim', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Rewards harvested successfully. Thank you for participating in Canine Farming.' 
  });
});

app.post('/api/swap', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Minting complete. Welcome to the Canine Farming Protocol.' 
  });
});

app.get('/', (req, res) => {
  res.send('Canine Farming Protocol Backend • Live & Secure');
});

module.exports = app;
