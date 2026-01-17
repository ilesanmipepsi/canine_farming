// 1. APPROVE ENDPOINT: Tells Pi Network to show the Wallet UI
app.post('/api/payments/approve', async (req, res) => {
  const { paymentId } = req.body;
  
  try {
    // IMPORTANT: You must call the Pi API to approve the payment
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
    // IMPORTANT: You must submit the txid to Pi Network to complete the transaction
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
