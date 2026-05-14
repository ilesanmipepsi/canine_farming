const BACKEND_URL = 'https://canine-farming.vercel.app';

document.addEventListener('DOMContentLoaded', () => {

    const connectBtn = document.getElementById('connect');
    const mintBtn = document.getElementById('mintBtn');
    const stakeBtn = document.getElementById('stakeBtn');
    const claimBtn = document.getElementById('claimBtn');

    // Hide action buttons initially
    if (mintBtn) mintBtn.classList.add('hidden');
    if (stakeBtn) stakeBtn.classList.add('hidden');
    if (claimBtn) claimBtn.classList.add('hidden');

    // Initialize Pi Session
    if (connectBtn) {
        connectBtn.onclick = async () => {
            try {
                const auth = await window.Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
                
                document.getElementById('username').innerText = auth.user.username || 'Connected';
                alert('✅ Wallet connected successfully: ' + auth.user.username);

                // Reveal other buttons
                if (mintBtn) mintBtn.classList.remove('hidden');
                if (stakeBtn) stakeBtn.classList.remove('hidden');
                if (claimBtn) claimBtn.classList.remove('hidden');

                connectBtn.style.opacity = "0.7";
                connectBtn.style.pointerEvents = "none";

            } catch (err) {
                console.error(err);
                alert('Auth failed: ' + (err.message || err));
            }
        };
    }

    // Verify Step 10 Payment
    document.querySelectorAll('.test').forEach(btn => {
        btn.onclick = async (e) => {
            const targetBtn = e.target;
            const originalText = targetBtn.innerText;
            targetBtn.innerText = 'Processing...';
            targetBtn.disabled = true;

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
                        }).then(res => {
                            if (res.ok) {
                                alert('✅ Transaction processed successfully!');
                                targetBtn.innerText = originalText;
                                targetBtn.disabled = false;
                                return res.json();
                            } else {
                                throw new Error("Completion failed");
                            }
                        });
                    },
                    onCancel: () => {
                        targetBtn.innerText = originalText;
                        targetBtn.disabled = false;
                    },
                    onError: (error) => {
                        alert("Payment Error: " + error.message);
                        targetBtn.innerText = originalText;
                        targetBtn.disabled = false;
                    }
                });
            } catch (err) {
                alert("Error: " + err.message);
                targetBtn.innerText = originalText;
                targetBtn.disabled = false;
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
