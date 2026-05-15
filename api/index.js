const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const BASE_URL = "https://api.minepi.com";
const API_KEY = process.env.PI_API_KEY;

if (!API_KEY) console.warn("⚠️ PI_API_KEY missing!");

// ===================== CRITICAL PAYMENT PATH (Must be FAST) =====================
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
    console.error('Approve Error:', err.message);
    res.status(500).json({ error: "Approval failed" });
  }
});

app.post('/api/payments/complete', async (req, res) => {
  const { paymentId, txid, username } = req.body;
  if (!paymentId) return res.status(400).json({ error: "Missing paymentId" });

  try {
    // Pure Pi completion - Keep this as fast as possible
    const response = await axios.post(`${BASE_URL}/v2/payments/${paymentId}/complete`, { txid }, {
      headers: { 
        'Authorization': `Key ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Payment Completed: ${paymentId} | User: ${username || 'N/A'}`);
    res.status(200).json({ success: true });

  } catch (err) {
    console.error('Complete Error:', err.response?.data || err.message);
    res.status(500).json({ error: "Completion failed" });
  }
});

// ===================== USER STATUS (Separate & Non-Critical) =====================
app.get('/api/user-status', async (req, res) => {
  res.json({ hasActivated: false });   // Temporary - we'll enable Supabase later
});

// Other actions
app.post('/api/stake', (req, res) => res.json({ success: true, message: 'Successfully staked $CFM.' }));
app.post('/api/swap', (req, res) => res.json({ success: true, message: 'Minting complete.' }));
app.post('/api/claim', (req, res) => res.json({ success: true, message: 'Rewards harvested successfully.' }));

app.get('/', (req, res) => res.send('Backend Live'));

module.exports = app;
