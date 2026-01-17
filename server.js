const API_KEY = process.env.PI_API_KEY; // Must be 2026 Mainnet/Testnet key
const BASE_URL = 'https://api.minepi.com'; // Standard 2026 API endpoint

// 1. APPROVE ENDPOINT (Must return specific Pi Network response)
app.post('/api/payments/approve', async (req, res) => {
  const { paymentId } = req.body;
  try {
    // MANDATORY: You must POST to Pi's server to enable the wallet popup
    await axios.post(`${BASE_URL}/payments/${paymentId}/approve`, {}, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    res.status(200).json({ approved: true });
  } catch (err) {
    console.error('Approve Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Approval failed' });
  }
});

// 2. COMPLETE ENDPOINT (Required to turn Step 10 GREEN)
app.post('/api/payments/complete', async (req, res) => {
  const { paymentId, txid } = req.body;
  try {
    // MANDATORY: You must submit the txid to Pi's server to finalize
    const response = await axios.post(`${BASE_URL}/payments/${paymentId}/complete`, { txid }, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Complete Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Completion failed' });
  }
});
