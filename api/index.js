const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

const BASE_URL = "https://minepi.com"; 
const API_KEY = process.env.PI_API_KEY; 

// --- FIXED ENDPOINTS (Aligned to handle vercel.json stripped routes) ---

// 1. APPROVE ENDPOINT
app.post('/payments/approve', async (req, res) => {
  const { paymentId } = req.body;
  console.log(`Approving Payment ID: ${paymentId}`);

  if (!paymentId) return res.status(400).json({ error: "Missing paymentId" });

  try {
    const response = await axios.post(`${BASE_URL}/payments/${paymentId}/approve`, {}, {
      headers: { 
        'Authorization': `Key ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Approval Success: ${paymentId}`);
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Approval Failed:', err.response?.data || err.message);
    res.status(500).json({ error: "Backend approval failure" });
  }
});

// 2. COMPLETE ENDPOINT
app.post('/payments/complete', async (req, res) => {
  const { paymentId, txid } = req.body;
  console.log(`Completing Payment ID: ${paymentId} with TXID: ${txid}`);

  try {
    const response = await axios.post(`${BASE_URL}/payments/${paymentId}/complete`, { txid }, {
      headers: { 
        'Authorization': `Key ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Completion Success: ${paymentId}`);
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Completion Failed:', err.response?.data || err.message);
    res.status(500).json({ error: "Backend completion failure" });
  }
});

// --- GAMEFI SYSTEM ROUTES ---

app.post('/stake', (req, res) => {
  res.status(200).json({ success: true, message: 'Staked successfully! 400% APY active.' });
});

app.post('/claim', (req, res) => {
  res.status(200).json({ success: true, message: 'Harvest successful!' });
});

app.post('/swap', (req, res) => {
  res.status(200).json({ success: true, message: 'Mint complete! 1 Puppy token generated.' });
});

app.get('/', (req, res) => res.send('Canine Farming Protocol Live Engine.'));

module.exports = app;
