// 1. ENVIRONMENT CONFIGURATION
const BACKEND_URL = 'canine-farming.vercel.app'; 

// Sandbox testing validation parameters (Required for Step 10)
window.Pi.init({ version: "2.0", sandbox: true }); 

// 2. CRYPTO WALLET CONNECT HANDSHAKE (With Auto-Resolution Patch)
const connectBtn = document.getElementById('connect');
if (connectBtn) {
  connectBtn.onclick = async () => {
    try {
      const auth = await window.Pi.authenticate(['username', 'payments'], async (payment) => {
        console.log('Ghost transaction intercepted! Resolving status...', payment);
        
        // AUTO-FORCE PAYMENT CLOSURE TO UNBLOCK USER
        try {
          await fetch(`${BACKEND_URL}/api/payments/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId: payment.identifier, txid: "AUTO_CLEARED_GHOST_TXID" })
          });
          alert("Stuck payment cleared from sandbox state. Please tap 'Verify Step 10' again.");
        } catch (clearErr) {
          console.error("Failed to force-clear ghost payment:", clearErr);
        }
      });
      
      document.getElementById('username').innerText = auth.user.username;
      alert('Wallet session initialized successfully: ' + auth.user.username);
    } catch (err) {
      alert('Initialization aborted: ' + err.message);
    }
  };
}

// 3. SECURE BLOCKCHAIN TRANSACTION TRIGGER (User-To-App Checkout Modal)
document.querySelectorAll('.test').forEach(btn => {
  btn.onclick = async (e) => {
    const targetBtn = e.target;
    const originalText = targetBtn.innerText;
    targetBtn.innerText = 'Invoking Secure Wallet...';

    try {
      window.Pi.createPayment({
        amount: 0.1,
        memo: "Step 10 Verification Procedure",
        metadata: { action: "test_buy" }
      }, {
        // Phase A: Node Backend Pre-processing Verification Request
        onReadyForServerApproval: (paymentId) => {
          console.log("Transmission to validation core initiated:", paymentId);
          return fetch(`${BACKEND_URL}/api/payments/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId })
          }).then(res => {
            if (!res.ok) throw new Error("Backend infrastructure validation failed.");
            return res.json();
          });
        },
        
        // Phase B: Node Backend Block Settlement Submission
        onReadyForServerCompletion: (paymentId, txid) => {
          console.log("Submitting transaction payload to backend cluster:", paymentId, txid);
          return fetch(`${BACKEND_URL}/api/payments/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid })
          }).then(res => {
            if (!res.ok) throw new Error("Backend node failed ledger finalization.");
            alert('Success! Sandbox ledger configuration complete.');
            targetBtn.innerText = originalText;
            return res.json();
          });
        },
        
        onCancel: (paymentId) => { 
          console.log("Transaction execution cancelled:", paymentId);
          targetBtn.innerText = originalText; 
        },
        
        onError: (error, payment) => { 
          console.error("SDK Pipeline Error:", error);
          alert("Wallet Overlay Interface Error: " + error.message); 
          targetBtn.innerText = originalText; 
        }
      });
    } catch (err) {
      alert("Pipeline Execution Halted: " + err.message);
      targetBtn.innerText = originalText;
    }
  };
});

// 4. GameFi PROTOCOL LOGIC (Off-chain Staking and Reward Pools)
async function handleAction(endpoint) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    alert(data.message);
  } catch (err) {
    alert("Protocol response error: " + err.message);
  }
}

// Layout element binding operations
const stakeBtn = document.querySelector('.button.stake');
if (stakeBtn) stakeBtn.onclick = () => handleAction('stake');

const claimBtn = document.querySelector('.button.claim');
if (claimBtn) claimBtn.onclick = () => handleAction('claim');

const mintBtn = document.querySelector('.button.mint-btn');
if (mintBtn) mintBtn.onclick = () => handleAction('swap');
          
