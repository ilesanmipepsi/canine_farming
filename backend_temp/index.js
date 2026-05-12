const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

// CONFIGURATION
const BASE_URL = "https://minepi.com"; 
const API_KEY = process.env.PI_API_KEY; 

// --- PI NETWORK PAYMENT ENDPOINTS ---

// 1. APPROVE ENDPOINT
app.post('/api/payments/approve', async (req, res) => {
  const { paymentId } = req.body;
  console.log(`Approving Payment: ${paymentId}`);

  if (!paymentId) {
    return res.status(400).json({ error: "Missing paymentId" });
  }

  try {
    const response = await axios.post(`${BASE_URL}/payments/${paymentId}/approve`, {}, {
      headers: { 
        'Authorization': `Key ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Approval Success for ${paymentId}`);
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Approval Failed:', err.response?.data || err.message);
    res.status(500).json({ error: "Backend failed to approve" });
  }
});

// 2. COMPLETE ENDPOINT
app.post('/api/payments/complete', async (req, res) => {
  const { paymentId, txid } = req.body;
  console.log(`Completing Payment: ${paymentId} with TXID: ${txid}`);

  try {
    const response = await axios.post(`${BASE_URL}/payments/${paymentId}/complete`, { txid }, {
      headers: { 
        'Authorization': `Key ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Completion Success for ${paymentId}`);
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Completion Failed:', err.response?.data || err.message);
    res.status(500).json({ error: "Backend failed to complete" });
  }
});

// --- GAME LOGIC ENDPOINTS ---

// 3. STAKE ENDPOINT
app.post('/api/stake', (req, res) => {
  console.log("Stake request received");
  res.status(200).json({
    success: true,
    message: 'Staked successfully! 400% APY active'
  });
});

// 4. CLAIM ENDPOINT
app.post('/api/claim', (req, res) => {
  console.log("Claim request received");
  res.status(200).json({
    success: true,
    rewarded: 0.000025,
    total: 0.00005,
    message: 'Claim successful!'
  });
});

// 5. SWAP ENDPOINT
app.post('/api/swap', (req, res) => {
  console.log("Swap request received");
  res.status(200).json({
    success: true,
    cfm: 0.000025,
    message: 'You received 1 Puppy (0.000025 $CFM)!'
  });
});

// ROOT HEALTH CHECK
app.get('/', (req, res) => res.send('Backend is Active and Merged!'));

// EXPORT FOR VERCEL
module.exports = app;
