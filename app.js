// 1. Unified Init for 2026
Pi.init({ version: "2.0", sandbox: true }); 

// 2. Global State
let isConnected = false;

// 3. Fix the "Connect" Button
document.getElementById('connect').onclick = async () => {
    try {
        const auth = await Pi.authenticate(['username', 'payments'], onIncompletePayment);
        isConnected = true;
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('home').style.display = 'none';
    } catch (err) {
        console.error("Auth failed:", err);
        alert("Authorization failed. Ensure Sandbox is authorized on your phone.");
    }
};

// 4. Fix the "Test Buy" Button
document.getElementById('test-buy').onclick = () => {
    if (!isConnected) return alert("Click 'Connect' first!");
    
    Pi.createPayment({
        amount: 0.1,
        memo: "Step 10 Verification",
        metadata: { action: "test_buy" }
    }, {
        onReadyForServerApproval: (pid) => {
            // Your backend must call /approve via the Pi API
            return fetch('/api/payments/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId: pid })
            }).then(res => res.json());
        },
        onReadyForServerCompletion: (pid, txid) => {
            // Your backend must call /complete via the Pi API
            return fetch('/api/payments/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId: pid, txid })
            }).then(() => alert("Step 10 Success!"));
        },
        onCancel: (pid) => console.log("Cancelled", pid),
        onError: (err) => alert("Wallet Error: " + err.message)
    });
};
