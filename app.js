const BACKEND_URL = 'https://vercel.app'; 

// 1. Initialize for REAL Pi Browser
window.Pi.init({ version: "2.0", sandbox: false }); 

// 2. Connect Wallet Logic
document.getElementById('connect').onclick = async () => {
  try {
    const auth = await window.Pi.authenticate(['username', 'payments'], (payment) => {
      console.log('Incomplete payment found', payment);
    });
    document.getElementById('username').innerText = auth.user.username;
    document.getElementById('home').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
  } catch (err) {
    alert('Connect failed: ' + err.message);
  }
};

// 3. Test Buy Logic - Cleaned for compatibility
document.querySelectorAll('.test').forEach(btn => {
  btn.onclick = async (e) => {
    const targetBtn = e.target;
    targetBtn.innerText = 'Processing...';

    try {
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
            targetBtn.innerText = 'Test Buy 0.1 Pi (Step 10)';
          });
        },
        onCancel: () => { 
          targetBtn.innerText = 'Test Buy 0.1 Pi (Step 10)'; 
        },
        onError: (err) => { 
          alert("Payment Error: " + err.message); 
          targetBtn.innerText = 'Test Buy 0.1 Pi (Step 10)'; 
        }
      });
    } catch (err) {
      alert("Payment Failed to Start: " + err.message);
      targetBtn.innerText = 'Test Buy 0.1 Pi (Step 10)';
    }
  };
});
