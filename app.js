const BACKEND_URL = 'vercel.app';
‎let pioneerUsername = null;
‎
‎document.addEventListener('DOMContentLoaded', () => {
‎
‎    const connectBtn = document.getElementById('connect');
‎    const payBtn = document.getElementById('payBtn');
‎    const mintBtn = document.getElementById('mintBtn');
‎    const stakeBtn = document.getElementById('stakeBtn');
‎    const claimBtn = document.getElementById('claimBtn');
‎
‎    // Hide action buttons initially
‎    if (mintBtn) mintBtn.classList.add('hidden');
‎    if (stakeBtn) stakeBtn.classList.add('hidden');
‎    if (claimBtn) claimBtn.classList.add('hidden');
‎    if (payBtn) payBtn.classList.add('hidden');
‎
‎    // Initialize Pi Session
‎    if (connectBtn) {
‎        connectBtn.onclick = async () => {
‎            try {
‎                const auth = await window.Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
‎                
‎                pioneerUsername = auth.user.username;
‎                document.getElementById('username').innerText = pioneerUsername || 'Connected';
‎                alert('✅ Wallet connected successfully: ' + pioneerUsername);
‎
‎                // Transform button to a policy-compliant success badge
‎                connectBtn.innerText = "✓ Account Synced";
‎                connectBtn.classList.add("synced");
‎                connectBtn.style.pointerEvents = "none";
‎
‎                // Check server to see if this user has already completed their single 0.5 Pi entry activation
‎                await checkPioneerActivationStatus(pioneerUsername);
‎
‎            } catch (err) {
‎                console.error(err);
‎                alert('Auth failed: ' + (err.message || err));
‎            }
‎        };
‎    }
‎
‎    // Single-Entry 0.5 Test-Pi Allocation Activation
‎    if (payBtn) {
‎        payBtn.onclick = async (e) => {
‎            const targetBtn = e.target;
‎            const originalText = targetBtn.innerText;
‎            targetBtn.innerText = 'Processing Allocation...';
‎            targetBtn.disabled = true;
‎
‎            try {
‎                window.Pi.createPayment({
‎                    amount: 0.5,
‎                    memo: "Canine Farming Protocol - Single Entry Simulation Activation",
‎                    metadata: { action: "activation_buy" }
‎                }, {
‎                    onReadyForServerApproval: (paymentId) => {
‎                        return fetch(`${BACKEND_URL}/api/payments/approve`, {
‎                            method: 'POST',
‎                            headers: { 'Content-Type': 'application/json' },
‎                            body: JSON.stringify({ paymentId })
‎                        }).then(res => res.ok ? res.json() : Promise.reject("Approval failed"));
‎                    },
‎                    onReadyForServerCompletion: (paymentId, txid) => {
‎                        return fetch(`${BACKEND_URL}/api/payments/complete`, {
‎                            method: 'POST',
‎                            headers: { 'Content-Type': 'application/json' },
‎                            body: JSON.stringify({ paymentId, txid, username: pioneerUsername })
‎                        }).then(res => {
‎                            if (res.ok) {
‎                                alert('🚀 Simulation Allocation Activated Successfully!');
‎                                targetBtn.innerText = originalText;
‎                                unlockSimulationFeatures(0.000025000000); // Expose game layout and kick off ticker
‎                                return res.json();
‎                            } else {
‎                                throw new Error("Completion failed");
‎                            }
‎                        });
‎                    },
‎                    onCancel: () => {
‎                        targetBtn.innerText = originalText;
‎                        targetBtn.disabled = false;
‎                    },
‎                    onError: (error) => {
‎                        alert("Payment Error: " + error.message);
‎                        targetBtn.innerText = originalText;
‎                        targetBtn.disabled = false;
‎                    }
‎                });
‎            } catch (err) {
‎                alert("Error: " + err.message);
‎                targetBtn.innerText = originalText;
‎                targetBtn.disabled = false;
‎            }
‎        };
‎    }
‎
‎    // Dynamic Server Verification Check
‎    async function checkPioneerActivationStatus(username) {
‎        try {
‎            const response = await fetch(`${BACKEND_URL}/api/user-status?username=${username}`);
‎            const data = await response.json();
‎
‎            if (data.hasActivated) {
‎                // If user already paid, bypass payment button and load their saved balance profile directly
‎                unlockSimulationFeatures(data.currentCfmBalance);
‎            } else {
‎                // New user: expose the 0.5 Pi activation barrier button
‎                if (payBtn) payBtn.classList.remove('hidden');
‎            }
‎        } catch (err) {
‎            console.error("Database status sync fallback:", err);
‎            // Sandbox fallback interface for development environments
‎            if (payBtn) payBtn.classList.remove('hidden');
‎        }
‎    }
‎
‎    // Expose application controls and mount our frontend live counting engine
‎    function unlockSimulationFeatures(savedBalance) {
‎        if (payBtn) payBtn.classList.add('hidden'); // Close out the single-entry validation step
‎        
‎        if (mintBtn) mintBtn.classList.remove('hidden');
‎        if (stakeBtn) stakeBtn.classList.remove('hidden');
‎        if (claimBtn) claimBtn.classList.remove('hidden');
‎
‎        // Spin up the fast UI counter embedded in index.html
‎        if (typeof startLiveTicker === "function") {
‎            startLiveTicker(savedBalance);
‎        }
‎    }
‎
‎    // Core DeFi Interaction Router
‎    async function handleAction(endpoint) {
‎        try {
‎            const res = await fetch(`${BACKEND_URL}/api/${endpoint}`, { 
‎                method: 'POST',
‎                headers: { 'Content-Type': 'application/json' },
‎                body: JSON.stringify({ username: pioneerUsername })
‎            });
‎            const data = await res.json();
‎            alert(data.message || 'Action completed successfully');
‎            
‎            // If user harvested rewards, refresh their baseline data to sync client ticker state
‎            if (endpoint === 'claim' && data.updated_balance) {
‎                unlockSimulationFeatures(data.updated_balance);
‎            }
‎        } catch (err) {
‎            alert("Protocol Error: " + err.message);
‎        }
‎    }
‎
‎    if (stakeBtn) stakeBtn.onclick = () => handleAction('stake');
‎    if (claimBtn) claimBtn.onclick = () => handleAction('claim');
‎    if (mintBtn) mintBtn.onclick = () => handleAction('swap'); // Maps directly to your backend swap router
‎});
‎
‎// Mandatory global recovery placeholder hook for standard Pi SDK configurations
‎function onIncompletePaymentFound(payment) {
‎    console.log('Hanging payment capture triggered:', payment);
‎    fetch(`${BACKEND_URL}/api/payments/complete`, {
‎        method: 'POST',
‎        headers: { 'Content-Type': 'application/json' },
‎        body: JSON.stringify({ paymentId: payment.identifier, txid: "AUTO_CLEARED" })
‎    }).catch(() => {});
‎}
