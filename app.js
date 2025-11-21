const BACKEND_URL = 'https://canine-farming.vercel.app';   // ← YOUR EXACT VERCEL URL (short one)

const scopes = ['username', 'payments'];

function onIncompletePaymentFound(payment) {
  fetch(`${BACKEND_URL}/api/payments/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId: payment.identifier, txid: payment.transaction?.txid || null })
  });
}

Pi.authenticate(scopes, onIncompletePaymentFound)
  .then(auth => {
    document.getElementById('username').innerText = auth.user.username;
    document.getElementById('home').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
  })
  .catch(err => console.error('Auth failed:', err));

// SWAP $10 worth of Pi
document.getElementById('swap')?.addEventListener('click', () => {
  const paymentData = {
    amount: 10,   // $10 USD (Pi SDK converts to current Pi amount)
    memo: "Canine Farming – 1 Puppy (0.000025 $CFM)",
    metadata: { action: "buy_puppy" }
  };

  const callbacks = {
    onReadyForServerApproval: pid => fetch(`${BACKEND_URL}/api/payments/approve`, { method: 'POST, body: JSON.stringify({ paymentId: pid }) }),
    onReadyForServerCompletion: (pid, txid) => fetch(`${BACKEND_URL}/api/payments/complete`, { method: 'POST', body: JSON.stringify({ paymentId: pid, txid }) })
      .then(() => alert('Success! You received 1 Puppy')),
    onCancel: () => alert('Swap cancelled'),
    onError: (error) => alert('Error: ' + error.message)
  };

  Pi.createPayment(paymentData, callbacks);
});

// STAKE
document.getElementById('stake')?.addEventListener('click', async () => {
  try {
    const auth = await Pi.authenticate(['payments']);
    const res = await fetch(`${BACKEND_URL}/api/stake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: auth.accessToken })
    });
    const data = await res.json();
    alert(data.success ? 'Staked! 400% APY active' : data.error || 'Stake failed');
  } catch (e) { alert('Stake failed'); }
});

// CLAIM
document.getElementById('claim')?.addEventListener('click', async () => {
  try {
    const auth = await Pi.authenticate(['payments']);
    const res = await fetch(`${BACKEND_URL}/api/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: auth.accessToken })
    });
    const data = await res.json();
    alert(data.success ? `Claimed ${data.rewarded?.toFixed(8)} $CFM!` : data.error);
  } catch (e) { alert('Claim failed'); }
});
