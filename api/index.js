const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

// FIXED: Correct official Pi API v2 URL
const BASE_URL = "https://minepi.com";
const API_KEY = process.env.PI_API_KEY; 

// 1. APPROVE ENDPOINT
app.post('/api/payments/approve', async (req, res) => {
  const { paymentId } = req.body;
  console.log(`Approving Payment: ${paymentId}`);

  try {
    // FIXED: Correct path structure for /approve
    const response = await axios.post(`${BASE_URL}/payments/${paymentId}/approve`, {}, {
      headers: { 
        'Authorization': `Key ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Approval Success for ${paymentId}`);
    res.status(200).json(response.data);
  } catch (err) {
    // This will now log the actual error from Pi Network in your Vercel logs
    console.error('Approval Failed:', err.response?.data || err.message);
    res.status(500).json({ error: "Backend failed to approve" });
  }
});

// 2. COMPLETE ENDPOINT
app.post('/api/payments/complete', async (req, res) => {
  const { paymentId, txid } = req.body;
  console.log(`Completing Payment: ${paymentId} with TXID: ${txid}`);

  try {
    // FIXED: Correct path structure for /complete
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

app.get('/', (req, res) => res.send('Backend is Active!'));

// Export for Vercel
module.exports = app;


