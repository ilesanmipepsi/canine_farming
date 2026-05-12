// 1. CONFIGURATION
const BACKEND_URL = 'https://canine-farming.vercel.app'; 

// IMPORTANT: MUST be true for Testnet (Step 10 checklist)
window.Pi.init({ version: "2.0", sandbox: true }); 

// 2. CONNECT WALLET LOGIC
const connectBtn = document.getElementById('connect');
if (connectBtn) {
  connectBtn.onclick = async () => {
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
}

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
        onReadyForServerApproval: (paymentId) => {
          return fetch(`${BACKEND_URL}/api/payments/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId })
          }).then(res => {
            if (!res.ok) throw new Error("Server failed to approve.");
            return res.json();
          });
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          return fetch(`${BACKEND_URL}/api/payments/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid })
          }).then(res => {
            if (!res.ok) throw new Error("Server failed to complete.");
            alert('Success! Checklist step 10 updated.');
            targetBtn.innerText = originalText;
            return res.json();
          });
        },
        onCancel: (paymentId) => { targetBtn.innerText = originalText; },
        onError: (error, payment) => { 
          alert("Payment Error: " + error.message); 
          targetBtn.innerText = originalText; 
        }
      });
    } catch (err) {
      alert("Failed: " + err.message);
      targetBtn.innerText = originalText;
    }
  };
});

// 4. GameFi PROTOCOL LOGIC (Stake, Claim, Swap)
async function handleAction(endpoint) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    alert(data.message);
  } catch (err) {
    alert("Action failed: " + err.message);
  }
}

// Safer button attachment
const stakeBtn = document.querySelector('.button.stake');
if (stakeBtn) stakeBtn.onclick = () => handleAction('stake');

const claimBtn = document.querySelector('.button.claim');
if (claimBtn) claimBtn.onclick = () => handleAction('claim');

// Target the Swap button specifically
document.querySelectorAll('.button').forEach(btn => {
  if (btn.innerText.includes('Swap')) {
    btn.onclick = () => handleAction('swap');
  }
});
            
