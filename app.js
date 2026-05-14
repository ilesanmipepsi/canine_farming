const BACKEND_URL = 'https://canine-farming.vercel.app';

document.addEventListener('DOMContentLoaded', () => {

    const connectBtn = document.getElementById('connect');
    const mintBtn = document.getElementById('mintBtn');
    const stakeBtn = document.getElementById('stakeBtn');
    const claimBtn = document.getElementById('claimBtn');

    // Initialize Pi Session
    if (connectBtn) {
        connectBtn.onclick = async () => {
            try {
                const auth = await window.Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
                
                document.getElementById('username').innerText = auth.user.username || 'Connected';
                alert('✅ Wallet connected successfully: ' + auth.user.username);

                // Show the other buttons after successful connection
                if (mintBtn) mintBtn.classList.remove('hidden');
                if (stakeBtn) stakeBtn.classList.remove('hidden');
                if (claimBtn) claimBtn.classList.remove('hidden');

                // Optionally disable connect button after success
                connectBtn.style.opacity = "0.6";
                connectBtn.style.pointerEvents = "none";

            } catch (err) {
                console.error(err);
                alert('Auth failed: ' + (err.message || err));
            }
        };
    }

    // Verify Step 10
    document.querySelectorAll('.test').forEach(btn => {
        btn.onclick = async (e) => {
            const targetBtn = e.target;
            const originalText = targetBtn.innerText;
            targetBtn.innerText = 'Processing...';

            try {
                window.Pi.createPayment({
                    amount: 0.1,
                    memo: "Step 10 Verification - Canine Farming",
                    metadata: { action: "test_buy" }
                }, {
                    onReadyForServerApproval: (paymentId) => {
                        return fetch(`${BACKEND_URL}/api/payments/approve`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ paymentId })
                        }).then(res => res.ok ? res.json() : Promise.reject("Approval failed"));
                    },
                    onReadyForServerCompletion: (paymentId, txid) => {
                        return fetch(`${BACKEND_URL}/api/payments/complete`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ paymentId, txid })
                        }).then(res => res.ok ? res.json() : Promise.reject("Completion failed"));
                    },
                    onCancel: () => targetBtn.innerText = originalText,
                    onError: (error) => {
                        alert("Payment Error: " + error.message);
                        targetBtn.innerText = originalText;
                    }
                });
            } catch (err) {
                alert("Error: " + err.message);
                targetBtn.innerText = originalText;
            }
        };
    });

    // Other Actions
    async function handleAction(endpoint) {
        try {
            const res = await fetch(`${BACKEND_URL}/api/${endpoint}`, { method: 'POST' });
            const data = await res.json();
            alert(data.message || 'Action completed successfully');
        } catch (err) {
            alert("Protocol Error: " + err.message);
        }
    }

    if (stakeBtn) stakeBtn.onclick = () => handleAction('stake');
    if (claimBtn) claimBtn.onclick = () => handleAction('claim');
    if (mintBtn) mintBtn.onclick = () => handleAction('swap');
});

function onIncompletePaymentFound(payment) {
    console.log('Incomplete payment:', payment);
    fetch(`${BACKEND_URL}/api/payments/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payment.identifier, txid: "AUTO_CLEARED" })
    }).catch(() => {});
}
