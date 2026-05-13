// 1. ENVIRONMENT CONFIGURATION
const BACKEND_URL = 'vercel.app'; 

// Initialize SDK (Required for Sandbox Testing)
window.Pi.init({ version: "2.0", sandbox: true }); 

// 2. CRYPTO WALLET HANDSHAKE
const connectBtn = document.getElementById('connect');
if (connectBtn) {
  connectBtn.onclick = async () => {
    try {
      const auth = await window.Pi.authenticate(['username', 'payments'], async (payment) => {
        console.log('Intercepted open transaction. Clearing state...', payment);
        try {
          await fetch(`${BACKEND_URL}/api/payments/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId: payment.identifier, txid: "AUTO_CLEARED_GHOST_TXID" })
          });
          alert("Pending transaction cleared. Please click 'Verify Step 10' again.");
        } catch (clearErr) {
          console.error("Auto-clear failed:", clearErr);
        }
      });
      
      document.getElementById('username').innerText = auth.user.username;
      alert('Wallet connected successfully: ' + auth.user.username);
    } catch (err) {
      alert('Initialization aborted: ' + err.message);
    }
  };
}

// 3. SECURE BLOCKCHAIN CHECKOUT OVERLAY (Verify Step 10)
document.querySelectorAll('.test').forEach(btn => {
  btn.onclick = async (e) => {
    const targetBtn = e.target;
    const originalText = targetBtn.innerText;
    targetBtn.innerText = 'Invoking Wallet...';

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
            if (!res.ok) throw new Error("Backend validation failed.");
            return res.json();
          });
        },
        
        onReadyForServerCompletion: (paymentId, txid) => {
          return fetch(`${BACKEND_URL}/api/payments/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid })
          }).then(res => {
            if (!res.ok) throw new Error("Backend finalization failed.");
            alert('Success! Transaction processed.');
            targetBtn.innerText = originalText;
            return res.json();
          });
        },
        
        onCancel: (paymentId) => { 
          targetBtn.innerText = originalText; 
        },
        
        onError: (error, payment) => { 
          alert("Wallet Overlay Interface Error: " + error.message); 
          targetBtn.innerText = originalText; 
        }
      });
    } catch (err) {
      alert("Execution Halted: " + err.message);
      targetBtn.innerText = originalText;
    }
  };
});

// 4. GameFi CORE PROTOCOL LOGIC
async function handleAction(endpoint) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    alert(data.message);
  } catch (err) {
    alert("Protocol Error: " + err.message);
  }
}

const stakeBtn = document.querySelector('.button.stake');
if (stakeBtn) stakeBtn.onclick = () => handleAction('stake');

const claimBtn = document.querySelector('.button.claim');
if (claimBtn) claimBtn.onclick = () => handleAction('claim');

document.querySelectorAll('.button').forEach(btn => {
  if (btn.innerText.includes('Mint')) {
    btn.onclick = () => handleAction('swap');
  }
});
    
