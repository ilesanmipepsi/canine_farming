const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

const BASE_URL = "https://minepi.com";
// Ensure this matches your Vercel Environment Variable name exactly
const API_KEY = process.env.PI_API_KEY; 

// 1. APPROVE ENDPOINT
app.post('/api/payments/approve', async (req, res) => {
  const { paymentId } = req.body;
  console.log(`Approving Payment: ${paymentId}`);

  try {
    const response = await axios.post(`${BASE_URL}/payments/${paymentId}/approve`, {}, {
      headers: { 
        'Authorization': `Key ${API_KEY}`, // Note: Pi API usually uses "Key" or "Bearer"
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

app.get('/', (req, res) => res.send('Backend is Active!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
