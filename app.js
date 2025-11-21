const BACKEND_URL = 'https://canine-farming.vercel.app';  // Your exact Vercel URL

const scopes = ['username', 'payments'];

// Handle incomplete payments
function onIncompletePaymentFound(payment) {
  fetch(`${BACKEND_URL}/api/payments/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentId: payment.identifier,
      txid: payment.transaction?.txid || null
    })
  }).catch(() => {});
}

// CONNECT WALLET
document.getElementById('connect')?.addEventListener('click', () => {
  Pi.authenticate(scopes, onIncompletePaymentFound)
    .then(auth => {
      document.getElementById('username').innerText = auth.user.username;
      document.getElementById('home').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
    })
    .catch(err => alert('Connect failed: ' + err.message));
});

// SWAP
document.querySelectorAll('#swap').forEach(btn => {
  btn.onclick = () => {
    Pi.createPayment({
      amount: 10,
      memo: "Canine Farming – 1 Puppy (0.000025 $CFM)",
      metadata: { action: "buy_puppy" }
    }, {
      onReadyForServerApproval: pid => fetch(`${BACKEND_URL}/api/payments/approve`, { method: 'POST', body: JSON.stringify({ paymentId: pid }), headers: {'Content-Type':'application/json'} }),
      onReadyForServerCompletion: (pid, txid) => fetch(`${BACKEND_URL}/api/payments/complete`, { method: 'POST', body: JSON.stringify({ paymentId: pid, txid }), headers: {'Content-Type':'application/json'} }).then(() => alert('Success! You received 1 Puppy')),
      onCancel: () => alert('Swap cancelled'),
      onError: (e) => alert('Error: ' + e.message)
    });
  };
});

// STAKE
document.querySelectorAll('#stake').forEach(btn => {
  btn.onclick = async () => {
    try {
      const auth = await Pi.authenticate(['payments']);
      const res = await fetch(`${BACKEND_URL}/api/stake`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ token: auth.accessToken }) });
      const data = await res.json();
      alert(data.success ? 'Staked! 400% APY active' : data.error || 'Stake failed');
    } catch { alert('Stake failed'); }
  };
});

// CLAIM
document.querySelectorAll('#claim').forEach(btn => {
  btn.onclick = async () => {
    try {
      const auth = await Pi.authenticate(['payments']);
      const res = await fetch(`${BACKEND_URL}/api/claim`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ token: auth.accessToken }) });
      const data = await res.json();
      alert(data.success ? `Claimed ${(data.rewarded||0).toFixed(8)} $CFM!` : data.error || 'Claim failed');
    } catch { alert('Claim failed'); }
  };
});
