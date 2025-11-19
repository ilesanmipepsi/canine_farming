// app.js – FINAL VERSION (works in Pi Browser sandbox & production – NO localhost)

const scopes = ['username', 'payments'];

// This handles pending payments (required by Pi SDK)
function onIncompletePaymentFound(payment) {
  console.log('Pending payment:', payment);
  fetch('/payments/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentId: payment.identifier,
      txid: payment.transaction?.txid || null,
      debug: 'cancel'
    })
  });
}

// Authenticate user
Pi.authenticate(scopes, onIncompletePaymentFound)
  .then(auth => {
    document.getElementById('username').innerText = auth.user.username;
    document.getElementById('home').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    console.log('Connected:', auth.user.username);
  })
  .catch(err => alert('Connect failed: ' + err.message));

// ——————— SWAP 10 Pi → 0.000025 $CFM ———————
document.querySelectorAll('#swap').forEach(btn => {
  btn.onclick = () => {
    const paymentData = {
      amount: 10,
      memo: "Canine Farming – 1 Puppy (0.000025 $CFM)",
      metadata: { action: "buy_puppy" }
    };

    const callbacks = {
      onReadyForServerApproval: (paymentId) => {
        fetch('/payments/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId })
        });
      },
      onReadyForServerCompletion: (paymentId, txid) => {
        fetch('/payments/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, txid })
        }).then(() => alert('Success! You now own 1 Puppy 🐶'));
      },
      onCancel: () => alert('Swap cancelled'),
      onError: (error) => alert('Error: ' + error.message)
    };

    Pi.createPayment(paymentData, callbacks);
  };
});

// ——————— STAKE $CFM ———————
document.querySelectorAll('#stake').forEach(btn => {
  btn.onclick = async () => {
    try {
      const auth = await Pi.authenticate(['payments']);
      const res = await fetch('/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: auth.accessToken })
      });
      const data = await res.json();
      alert(data.success ? 'Staked successfully! 400% APY active' : data.error);
    } catch (e) { alert('Stake failed'); }
  };
});

// ——————— CLAIM REWARDS ———————
document.querySelectorAll('#claim')?.forEach(btn => {
  btn.onclick = async () => {
    try {
      const auth = await Pi.authenticate(['payments']);
      const res = await fetch('/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: auth.accessToken })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Claimed ${data.rewarded.toFixed(8)} $CFM!\nTotal: ${(data.total + 0.000025).toFixed(8)} $CFM${data.graduated ? '\nYou graduated to shareholder!' : ''}`);
      } else {
        alert(data.error);
      }
    } catch (e) { alert('Claim failed'); }
  };
});

// Placeholder buttons
document.getElementById('open-shop')?.addEventListener('click', () => alert('Shop coming soon!'));
document.getElementById('market')?.addEventListener('click', () => alert('Marketplace coming soon!'));
