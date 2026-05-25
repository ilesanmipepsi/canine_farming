const BACKEND_URL = 'https://canine-farming.vercel.app';
let pioneerUsername = null;
let tickerInterval = null;
let currentLocalBalance = 0.000025000000;
const REWARD_PER_MS = 0.000000000031709;

document.addEventListener('DOMContentLoaded', () => {

    const connectBtn = document.getElementById('connect');
    const payBtn = document.getElementById('payBtn');
    const claimBtn = document.getElementById('claimBtn');   // Kept as main action

    // Hide advanced buttons initially
    if (payBtn) payBtn.classList.add('hidden');
    if (claimBtn) claimBtn.classList.add('hidden');

    // Initialize Pi Session
    if (connectBtn) {
        connectBtn.onclick = async () => {
            try {
                const auth = await window.Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
                
                pioneerUsername = auth.user.username;
                document.getElementById('username').innerText = pioneerUsername || 'Connected';
                alert('✅ Wallet connected successfully: ' + pioneerUsername);

                connectBtn.innerText = "✓ Account Synced";
                connectBtn.style.opacity = "0.7";
                connectBtn.style.pointerEvents = "none";

                await checkPioneerActivationStatus(pioneerUsername);

            } catch (err) {
                console.error(err);
                alert('Auth failed: ' + (err.message || err));
            }
        };
    }

    // 0.5 Pi Activation
    if (payBtn) {
        payBtn.onclick = async (e) => {
            const targetBtn = e.target;
            const originalText = targetBtn.innerText;
            targetBtn.innerText = 'Processing Allocation...';
            targetBtn.disabled = true;

            try {
                window.Pi.createPayment({
                    amount: 0.5,
                    memo: "Canine Farming Protocol - Single Entry Simulation Activation",
                    metadata: { action: "activation_buy" }
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
                            body: JSON.stringify({ paymentId, txid, username: pioneerUsername })
                        }).then(res => {
                            if (res.ok) {
                                const successMsg = document.getElementById('successMessage');
                                if (successMsg) successMsg.classList.remove('hidden');

                                targetBtn.innerText = originalText;
                                targetBtn.disabled = false;

                                // Auto-start farming after a short delay
                                setTimeout(() => {
                                    startFarming();
                                }, 1800);

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
    }

    async function checkPioneerActivationStatus(username) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/user-status?username=${username}`);
            const data = await response.json();

            if (data.hasActivated) {
                startFarming();
            } else {
                if (payBtn) payBtn.classList.remove('hidden');
            }
        } catch (err) {
            console.error("Status check failed:", err);
            if (payBtn) payBtn.classList.remove('hidden');
        }
    }

    function startFarming() {
        const successMsg = document.getElementById('successMessage');
        if (successMsg) successMsg.classList.add('hidden');
        
        // Reveal main action button
        if (claimBtn) claimBtn.classList.remove('hidden');

        startLiveTicker(0.000025000000);
    }

    function hideSuccessMessage() {
        const successMsg = document.getElementById('successMessage');
        if (successMsg) successMsg.classList.add('hidden');
    }

    function startLiveTicker(startingBalance) {
        if (tickerInterval) clearInterval(tickerInterval);
        currentLocalBalance = startingBalance;

        const liveContainer = document.getElementById('liveBalanceContainer');
        if (liveContainer) liveContainer.classList.remove('hidden');

        tickerInterval = setInterval(() => {
            if (currentLocalBalance >= 1.0) {
                currentLocalBalance = 1.000000000000;
                clearInterval(tickerInterval);
            } else {
                currentLocalBalance += REWARD_PER_MS;
            }
            const tickerEl = document.getElementById('cfmTicker');
            if (tickerEl) tickerEl.innerText = currentLocalBalance.toFixed(12);
        }, 50);
    }

    async function handleAction(endpoint) {
        try {
            const res = await fetch(`${BACKEND_URL}/api/${endpoint}`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: pioneerUsername })
            });
            const data = await res.json();
            alert(data.message || 'Action completed successfully');
        } catch (err) {
            alert("Protocol Error: " + err.message);
        }
    }

    if (claimBtn) claimBtn.onclick = () => handleAction('claim');
});

function onIncompletePaymentFound(payment) {
    console.log('Incomplete payment:', payment);
    fetch(`${BACKEND_URL}/api/payments/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payment.identifier, txid: "AUTO_CLEARED" })
    }).catch(() => {});
}
