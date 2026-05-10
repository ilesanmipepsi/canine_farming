const express = require('express');
const cors = require('cors'); // Added for cross-origin access
const axios = require('axios');
const app = express();

// Middleware
app.use(cors()); // This allows your Spck Editor app to call these endpoints
app.use(express.json());

// Replace these with your actual values or Environment Variables
const BASE_URL = "https://minepi.com";
const API_KEY = process.env.PI_API_KEY; 

// 1. APPROVE ENDPOINT: Tells Pi Network to show the Wallet UI
app.post('/api/payments/approve', async (req, res) => {
  const { paymentId } = req.body;
  
  try {
    await axios.post(`${BASE_URL}/payments/${paymentId}/approve`, {}, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    
    console.log(`Payment ${paymentId} approved on Pi Network`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Approval Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to approve payment with Pi Network' });
  }
});

// 2. COMPLETE ENDPOINT: Finalizes the transaction
app.post('/api/payments/complete', async (req, res) => {
  const { paymentId, txid } = req.body;

  try {
    await axios.post(`${BASE_URL}/payments/${paymentId}/complete`, { txid }, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });

    console.log(`Payment ${paymentId} marked as COMPLETE`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Completion Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to complete payment' });
  }
});

// Basic Root Route to check if server is alive
app.get('/', (req, res) => {
  res.send('Canine Farming Backend is Running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
  
