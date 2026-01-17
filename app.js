// Change to 'false' if testing on phone inside the Pi Browser
const isSandbox = true; 
const BACKEND_URL = 'https://canine-farming.vercel.app';

// 1. Initialize carefully
try {
  Pi.init({ version: "2.0", sandbox: isSandbox });
} catch (e) {
  console.error("SDK already initialized or failed:", e);
}

let currentUser = null;

// This function unlocks all buttons after a successful login
const unlockApp = (user) => {
  currentUser = user;
  document.getElementById('username').innerText = user.username;
  document.getElementById('home').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  console.log("App unlocked for:", user.username);
};

// CONNECT BUTTON
document.getElementById('connect').onclick = async () => {
  try {
    const auth = await Pi.authenticate(['username', 'payments'], (payment) => {
      // Automatic recovery for stuck payments
      fetch(`${BACKEND_URL}/api/payments/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payment.identifier, txid: payment.transaction.txid })
      });
    });
    unlockApp(auth.user);
  } catch (err) {
    alert("Connection failed. Did you Authorize Sandbox on your phone?");
  }
};

// TEST BUY BUTTON
document.getElementById('test-buy').onclick = () => {
  if (!currentUser) return alert("Please Connect Wallet first!");

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
      }).then(() => alert("Success! Checklist Step 10 is now clear."));
    },
    onCancel: (pid) => console.log("Cancelled", pid),
    onError: (err) => alert("Wallet Error: " + err.message)
  });
};
