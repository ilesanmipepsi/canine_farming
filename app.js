// app.js
const scopes = ['username', 'payments'];

// Incomplete payment handler (required by Pi SDK)
function onIncompletePaymentFound(payment) {
  console.log('Pending payment found:', payment.identifier);
  // Send to backend for completion or cancellation
  fetch('/payments/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentId: payment.identifier,
      txid: payment.transaction.txid,
      debug: 'cancel'  // Or 'complete' if approved
    })
  });
}

// Authenticate user
Pi.authenticate(scopes, onIncompletePaymentFound).then(function(auth) {
  console.log('User authenticated:', auth.user.username);
  // Store auth token for backend calls
  const accessToken = auth.accessToken;
  document.getElementById('username').innerText = auth.user.username;
  document.getElementById('home').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
}).catch(function(error) {
  console.error('Authentication failed:', error);
  alert('Connection failed: ' + error.message);
});

// Swap $10 for 0.000025 $CFM
document.getElementById('swap').onclick = () => {
  const paymentData = {
    amount: 10,
    memo: "Buy 1 Puppy (0.000025 $CFM)",
    metadata: { type: "puppy_purchase" }
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
      }).then(() => alert('Puppy purchased! 0.000025 $CFM credited 🐶'));
    },
    onCancel: () => alert('Swap cancelled'),
    onError: (error) => alert('Swap error: ' + error.message)
  };

  Pi.createPayment(paymentData, callbacks).then(function(payment) {
    console.log('Payment created:', payment.id);
  }).catch(function(error) {
    alert('Payment creation failed: ' + error.message);
  });
};

// Stake $CFM
document.getElementById('stake').onclick = async () => {
  try {
    const auth = await Pi.authenticate(['payments']);
    const res = await fetch('/stake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: auth.accessToken })
    });
    const data = await res.json();
    alert(data.success ? 'Staked successfully! 400% APY active' : data.error);
  } catch (err) {
    alert('Staking failed: ' + err.message);
  }
};

// Open Shop & Marketplace (placeholders)
document.getElementById('open-shop').onclick = () => alert('Shop opened! 0.0001 $CFM entry');
document.getElementById('market').onclick = () => alert('GSD Marketplace loaded');