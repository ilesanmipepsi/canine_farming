const BACKEND_URL = 'https://vercel.app'; 

// 1. Initialize - sandbox MUST be false for the real Pi Browser
window.Pi.init({ version: "2.0", sandbox: false }); 

// 2. Mandatory function for incomplete payments
async function onIncompletePaymentFound(payment) {
  console.log('Resolving incomplete payment:', payment.identifier);
  await fetch(`${BACKEND_URL}/api/payments/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId: payment.identifier, txid: payment.transaction?.txid })
  });
}

// 3. Connect Wallet Logic
document.getElementById('connect').onclick = async () => {
  const btn = document.getElementById('connect');
  const originalText = btn.innerText;
  btn.innerText = 'Connecting...';

  try {
    const auth = await window.Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
    document.getElementById('username').innerText = auth.user.username;
    document.getElementById('home').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
  } catch (err) {
    console.error('Auth failed:', err);
    alert('Connect failed. Make sure you are in the Pi Browser.');
    btn.innerText = originalText;
  }
};

// 4. Test Buy Logic (Fixed to prevent "Processing..." hang)
document.querySelectorAll('.test').forEach(btn => {
  btn.onclick = async (e) => {
    const targetBtn = e.target;
    const originalText = targetBtn.innerText;
    targetBtn.innerText = 'Processing...';

    try {
      // CLEAR STUCK PAYMENTS: This is why it was stuck on "Processing"
      const pending = await window.Pi.getPendingPayments();
      if (pending.length > 0) {
        await Promise.all(pending.map(p => window.Pi.cancelPayment(p.identifier)));
      }

      // Start the actual payment
      window.Pi.createPayment({
        amount: 0.1,
        memo: "Step 10 Verification",
        metadata: { action: "test_buy" }
      }, {
        onReadyForServerApproval: (pid) => {
          return fetch(`${BACKEND_URL}/api/payments/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId: pid })
          });
        },
        onReadyForServerCompletion: (pid, txid) => {
          return fetch(`${BACKEND_URL}/api/payments/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId: pid, txid })
          }).then(() => {
            alert('Success! Transaction Finished.');
            targetBtn.innerText = originalText;
          });
        },
        onCancel: () => { 
          targetBtn.innerText = originalText; 
        },
        onError: (err) => { 
          alert("Payment Error: " + err.message); 
          targetBtn.innerText = originalText; 
        }
      });
    } catch (err) {
      alert("System Error: " + err.message);
      targetBtn.innerText = originalText;
    }
  };
});
