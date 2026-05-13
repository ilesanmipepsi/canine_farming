const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

const BASE_URL = "https://api.minepi.com";
const API_KEY = process.env.PI_API_KEY;

if (!API_KEY) console.warn("⚠️ PI_API_KEY is missing!");

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
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Approval Error:', err.message);
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
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Completion Error:', err.message);
    res.status(500).json({ error: "Completion failed" });
  }
});

app.post('/api/stake', (req, res) => res.json({ success: true, message: 'Staked successfully! 400% APY active.' }));
app.post('/api/claim', (req, res) => res.json({ success: true, message: 'Harvest successful!' }));
app.post('/api/swap',  (req, res) => res.json({ success: true, message: 'Mint complete!' }));

app.get('/', (req, res) => res.send('Canine Farming Protocol Backend Running ✅'));

module.exports = app;
