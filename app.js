const BACKEND_URL = 'https://canine-farming.vercel.app'; 
const scopes = ['username', 'payments', 'wallet_address'];

// 1. Initialize immediately
Pi.init({ version: "2.0", sandbox: false });

// Global user variable to check auth status
let currentUser = null;

// Handle incomplete payments
function onIncompletePaymentFound(payment) {
  console.log('Incomplete payment found, resolving...');
  fetch(`${BACKEND_URL}/api/payments/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentId: payment.identifier,
      txid: payment.transaction?.txid || null
    })
  }).catch(err => console.error('Recovery failed:', err));
}

// CONNECT WALLET
document.getElementById('connect')?.addEventListener('click', () => {
  Pi.authenticate(scopes, onIncompletePaymentFound)
    .then(auth => {
      currentUser = auth.user;
      document.getElementById('username').innerText = auth.user.username;
      document.getElementById('home').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
    })
    .catch(err => alert('Auth failed: ' + err.message));
});

// TEST BUY BUTTON logic
const handleTestBuy = async (e) => {
  const btn = e.target;

  // CHECK: User must be authenticated
  if (!currentUser) {
    alert("Please click 'Connect Pi Wallet' first!");
    return;
  }

  btn.disabled = true;
  btn.innerText = 'Opening Wallet...';

  try {
    // Clear any stuck sessions
    const pending = await Pi.getPendingPayments();
    if (pending.length > 0) {
      await Promise.all(pending.map(p => Pi.cancelPayment(p.identifier)));
    }

    Pi.createPayment({
      amount: 0.1,
      memo: "Step 10 Verification",
      metadata: { action: "test_buy" }
    }, {
      onReadyForServerApproval: (pid) => {
        return fetch(`${BACKEND_URL}/api/payments/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: pid })
        }).then(res => res.json());
      },
      onReadyForServerCompletion: (pid, txid) => {
        return fetch(`${BACKEND_URL}/api/payments/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: pid, txid })
        }).then(res => {
          alert('Step 10 Success! Check your portal now.');
          btn.disabled = false;
          btn.innerText = 'Test Buy 0.1 Pi';
        });
      },
      onCancel: () => {
        btn.disabled = false;
        btn.innerText = 'Test Buy 0.1 Pi';
      },
      onError: (error) => {
        console.error(error);
        btn.disabled = false;
        btn.innerText = 'Error - Try Again';
      }
    });
  } catch (err) {
    console.error(err);
    btn.disabled = false;
  }
};

// Attach to both instances of the button
document.querySelectorAll('#test-buy').forEach(btn => {
  btn.addEventListener('click', handleTestBuy);
});
      
