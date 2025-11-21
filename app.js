// app.js – FINAL PRODUCTION VERSION (November 2025 – fully working in Pi Browser)

const BACKEND_URL = 'https://canine-farming.vercel.app';   // ← Your exact Vercel URL (short one)

const scopes = ['username', 'payments'];

// Handle any incomplete payments when user opens the app
function onIncompletePaymentFound(payment) {
  fetch(`${BACKEND_URL}/api/payments/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentId: payment.identifier,
      txid: payment.transaction?.txid || null
    })
  }).catch(() => { /* silent */ });
}

// Connect wallet on load
Pi.authenticate(scopes, onIncompletePaymentFound)
  .then((auth) => {
    document.getElementById('username').innerText = auth.user.username;
    document.getElementById('home').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
  })
  .catch((err) => {
    console.error(err);
    alert('Connect failed: ' + err.message);
  });

// SWAP – $10 USD worth of Pi → 0.000025 $CFM
document.querySelectorAll('#swap').forEach(btn => {
  btn.onclick = () => {
    const paymentData = {
      amount: 10,                                      // $10 USD (Pi SDK auto-converts to Pi)
      memo: "Canine Farming – 1 Puppy (0.000025 $CFM)",
      metadata: { action: "buy_puppy" }
    };

    const callbacks = {
      onReadyForServerApproval: (paymentId) => {
        return fetch(`${BACKEND_URL}/api/payments/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId })
        });
      },
      onReadyForServerCompletion: (paymentId, txid) => {
        return fetch(`${BACKEND_URL}/api/payments/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, txid })
        }).then(() => {
          alert('Success! You received 1 Puppy');
        });
      },
      onCancel: () => alert('Swap cancelled'),
      onError: (error) => alert('Payment error: ' + error.message)
    };

    Pi.createPayment(paymentData, callbacks);
  };
});

// STAKE
document.querySelectorAll('#stake').forEach(btn => {
  btn.onclick = async () => {
    try {
      const auth = await Pi.authenticate(['payments']);
      const res = await fetch(`${BACKEND_URL}/api/stake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: auth.accessToken })
      });
      const data = await res.json();
      alert(data.success ? 'Staked! 400% APY active' : data.error || 'Stake failed');
    } catch (e) {
      alert('Stake failed – check internet');
    }
  };
});

// CLAIM REWARDS
document.querySelectorAll('#claim').forEach(btn => {
  btn.onclick = async () => {
    try {
      const auth = await Pi.authenticate(['payments']);
      const res = await fetch(`${BACKEND_URL}/api/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: auth.accessToken })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Claimed ${Number(data.rewarded || 0).toFixed(8)} $CFM!`);
      } else {
        alert(data.error || 'Claim failed');
      }
    } catch (e) {
      alert('Claim failed – check internet');
    }
  };
});
