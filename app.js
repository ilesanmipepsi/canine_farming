// 1. CONFIGURATION
const BACKEND_URL = 'https://canine-farming.vercel.app'; 

// IMPORTANT: MUST be true for Testnet (Step 10 checklist)
window.Pi.init({ version: "2.0", sandbox: true }); 

// 2. CONNECT WALLET LOGIC
document.getElementById('connect').onclick = async () => {
  try {
    const auth = await window.Pi.authenticate(['username', 'payments'], (payment) => {
      console.log('Incomplete payment found', payment);
      // Optional: Send incomplete payment to your backend to resolve it
    });
    
    document.getElementById('username').innerText = auth.user.username;
    document.getElementById('home').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
  } catch (err) {
    alert('Connect failed: ' + err.message);
  }
};

// 3. PAYMENT LOGIC (User-to-App)
document.querySelectorAll('.test').forEach(btn => {
  btn.onclick = async (e) => {
    const targetBtn = e.target;
    const originalText = targetBtn.innerText;
    targetBtn.innerText = 'Processing...';

    try {
      window.Pi.createPayment({
        amount: 0.1,
        memo: "Step 10 Verification",
        metadata: { action: "test_buy" }
      }, {
        // PHASE 1: Backend Approval
        onReadyForServerApproval: (paymentId) => {
          console.log("Sending for server approval:", paymentId);
          return fetch(`${BACKEND_URL}/api/payments/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId })
          }).then(res => {
            if (!res.ok) throw new Error("Server failed to approve payment.");
            return res.json();
          });
        },

        // PHASE 2: Backend Completion
        onReadyForServerCompletion: (paymentId, txid) => {
          console.log("Sending for server completion:", paymentId, txid);
          return fetch(`${BACKEND_URL}/api/payments/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid })
          }).then(res => {
            if (!res.ok) throw new Error("Server failed to complete payment.");
            alert('Success! Checklist step 10 should now update.');
            targetBtn.innerText = originalText;
            return res.json();
          });
        },

        onCancel: (paymentId) => { 
          console.log("Payment cancelled:", paymentId);
          targetBtn.innerText = originalText; 
        },

        onError: (error, payment) => { 
          console.error("Payment error:", error);
          alert("Payment Error: " + error.message); 
          targetBtn.innerText = originalText; 
        }
      });
    } catch (err) {
      alert("Failed to start payment: " + err.message);
      targetBtn.innerText = originalText;
    }
  };
});
            
