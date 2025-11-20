// app.js – FINAL VERSION FOR PUBLIC BACKEND (NO localhost, NO disappearing)

const BACKEND_URL = 'https://canine-farming.vercel.app';   // ←←← CHANGE THIS TO YOUR REAL URL

const scopes = ['username', 'payments'];

function onIncompletePaymentFound(payment) {
  fetch(`${BACKEND_URL}/api/stake`,...) {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentId: payment.identifier,
      txid: payment.transaction?.txid || null,
      debug: 'cancel'
    })
  });
}

Pi.authenticate(scopes, onIncompletePaymentFound)
  .then(auth => {
    document.getElementById('username').innerText = auth.user.username;
    document.getElementById('home').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
  })
  .catch(err => alert('Connect failed: ' + err.message));

// SWAP – CORRECTED: $10 worth of Pi (dynamic price)
document.querySelectorAll('#swap').forEach(btn => {
  btn.onclick = () => {
    // $10 USD in Pi (Pi’s SDK automatically converts USD → Pi amount)
    const paymentData = {
      amount: 10,                  // ← this is $10 USD, NOT 10 Pi
      memo: "Canine Farming – 1 Puppy (0.000025 $CFM)",
      metadata: { action: "buy_puppy" }
    };

    const callbacks = {
      onReadyForServerApproval: (paymentId) => fetch(`${BACKEND_URL}/api/payments/approve`, { method: 'POST', body: JSON.stringify({ paymentId }) }),
      onReadyForServerCompletion: (paymentId, txid) => fetch(`${BACKEND_URL}/api/payments/complete`, { method: 'POST', body: JSON.stringify({ paymentId, txid }) }).then(() => alert('Success! You received 1 Puppy 🐶')),
      onCancel: () => alert('Swap cancelled'),
      onError: (e) => alert('Error: ' + e.message)
    };

    Pi.createPayment(paymentData, callbacks);
  };
});

// STAKE
document.querySelectorAll('#stake').forEach(btn => {
  btn.onclick = async () => {
    try {
      const auth = await Pi.authenticate(['payments']);
      const res = await fetch(`${BACKEND_URL}/stake`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: auth.accessToken }) });
      const data = await res.json();
      alert(data.success ? 'Staked! 400% APY active' : data.error);
    } catch { alert('Stake failed'); }
  };
});

// CLAIM
document.querySelectorAll('#claim')?.forEach(btn => {
  btn.onclick = async () => {
    try {
      const auth = await Pi.authenticate(['payments']);
      const res = await fetch(`${BACKEND_URL}/claim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: auth.accessToken }) });
      const data = await res.json();
      alert(data.success ? `Claimed ${data.rewarded?.toFixed(8)} $CFM!` : data.error);
    } catch { alert('Claim failed'); }
  };
});


