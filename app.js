const handleTestBuy = async (e) => {
  if (!currentUser) return alert("Connect Wallet First!");
  
  const btn = e.target;
  btn.disabled = true;
  btn.innerText = 'Initializing Wallet...';

  try {
    // MANDATORY 2026 STEP: Check for and cancel "Ghost" payments
    const pending = await Pi.getPendingPayments();
    if (pending.length > 0) {
      console.log('Cancelling pending transactions...');
      await Promise.all(pending.map(p => Pi.cancelPayment(p.identifier)));
    }

    // Trigger the actual Wallet UI
    Pi.createPayment({
      amount: 0.1,
      memo: "Step 10 Verification",
      metadata: { action: "test_buy" }
    }, {
      onReadyForServerApproval: async (paymentId) => {
        console.log('Server approval started for:', paymentId);
        const response = await fetch(`${BACKEND_URL}/api/payments/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId })
        });
        
        if (!response.ok) throw new Error("Backend failed to approve with Pi API");
        return response.json();
      },
      onReadyForServerCompletion: async (paymentId, txid) => {
        await fetch(`${BACKEND_URL}/api/payments/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, txid })
        });
        alert('Payment Success! Checklist Step 10 should turn green.');
        btn.disabled = false;
        btn.innerText = 'Test Buy 0.1 Pi';
      },
      onCancel: (paymentId) => {
        console.log('User cancelled:', paymentId);
        btn.disabled = false;
        btn.innerText = 'Test Buy 0.1 Pi';
      },
      onError: (error, paymentId) => {
        console.error('Wallet UI Error:', error);
        alert('Wallet failed to open. Check your browser console.');
        btn.disabled = false;
        btn.innerText = 'Retry Test Buy';
      }
    });
  } catch (err) {
    console.error('Payment Flow Error:', err);
    btn.disabled = false;
    btn.innerText = 'Fix Error';
  }
};
