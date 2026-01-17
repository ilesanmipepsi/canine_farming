// Change this to 'true' only when testing in a desktop browser. 
// Set to 'false' for the final test inside the Pi Browser on your phone.
const isSandbox = true; 

const BACKEND_URL = 'https://canine-farming.vercel.app'; 
const scopes = ['username', 'payments', 'wallet_address'];

// 1. Initialize immediately with the correct flag
Pi.init({ version: "2.0", sandbox: isSandbox });

let currentUser = null;

// Mandatory recovery function for incomplete payments
async function onIncompletePaymentFound(payment) {
  console.log('Resolving incomplete payment:', payment.identifier);
  await fetch(`${BACKEND_URL}/api/payments/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId: payment.identifier, txid: payment.transaction?.txid })
  });
}

// FIX: Connect Button Logic
document.getElementById('connect')?.addEventListener('click', async () => {
  const btn = document.getElementById('connect');
  btn.innerText = 'Connecting...';

  try {
    // If in sandbox, ensure you authorized on mobile first!
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
    currentUser = auth.user;
    
    document.getElementById('username').innerText = currentUser.username;
    document.getElementById('home').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
  } catch (err) {
    console.error('Auth failed:', err);
    alert('Handshake failed. In Sandbox? Go to Pi App -> Utilities -> Authorize Sandbox.');
    btn.innerText = 'Connect Pi Wallet';
  }
});

// FIX: Test Buy Button logic
const handleTestBuy = async (e) => {
  if (!currentUser) return alert("Please connect wallet first!");
  
  const btn = e.target;
  btn.disabled = true;
  btn.innerText = 'Processing...';

  try {
    // Clear any "ghost" payments blocking the UI
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
        }).then(() => {
          alert('Transaction Complete! Step 10 should turn green.');
          btn.disabled = false;
          btn.innerText = 'Test Buy 0.1 Pi';
        });
      },
      onCancel: () => { btn.disabled = false; btn.innerText = 'Test Buy 0.1 Pi'; },
      onError: (err) => { alert(err.message); btn.disabled = false; }
    });
  } catch (err) {
    console.error(err);
    btn.disabled = false;
  }
};

document.querySelectorAll('#test-buy').forEach(b => b.onclick = handleTestBuy);
                                   
