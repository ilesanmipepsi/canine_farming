const BACKEND_URL = 'https://canine-farming.vercel.app';

document.addEventListener('DOMContentLoaded', () => {

    // Initialize Pi Session
    const connectBtn = document.getElementById('connect');
    if (connectBtn) {
        connectBtn.onclick = async () => {
            try {
                const auth = await window.Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
                
                document.getElementById('username').innerText = auth.user.username || 'Connected';
                alert('✅ Wallet connected successfully: ' + auth.user.username);
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

    document.querySelector('.button.stake').onclick = () => handleAction('stake');
    document.querySelector('.button.claim').onclick = () => handleAction('claim');
    document.querySelector('.button.mint').onclick = () => handleAction('swap');
});

function onIncompletePaymentFound(payment) {
    console.log('Incomplete payment:', payment);
    fetch(`${BACKEND_URL}/api/payments/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payment.identifier, txid: "AUTO_CLEARED" })
    }).catch(() => {});
                                }
