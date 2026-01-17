const BACKEND_URL = 'https://canine-farming.vercel.app';  // Your Vercel URL

const scopes = ['username', 'payments', 'wallet_address'];

// Handle incomplete payments
function onIncompletePaymentFound(payment) {
  fetch(`${BACKEND_URL}/api/payments/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentId: payment.identifier,
      txid: payment.transaction?.txid || null
    })
  })
  .then(res => res.json())
  .then(data => console.log('Incomplete payment handled:', data))
  .catch(err => console.error('Incomplete payment error:', err));
}

// CONNECT WALLET
document.getElementById('connect')?.addEventListener('click', () => {
  const connectBtn = document.getElementById('connect');
  connectBtn.disabled = true;
  connectBtn.innerText = 'Connecting...';

  Pi.authenticate(scopes, onIncompletePaymentFound)
    .then(auth => {
      document.getElementById('username').innerText = auth.user.username;
      document.getElementById('home').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
    })
    .catch(err => {
      console.error('Connect failed:', err);
      alert('Connect failed: ' + (err.message || 'Please try again'));
    })
    .finally(() => {
      connectBtn.disabled = false;
      connectBtn.innerText = 'Connect Pi Wallet';
    });
});

// NEW: Test Buy Button – Small amount for Step 10 verification
document.getElementById('test-buy')?.addEventListener('click', () => {
  const btn = document.getElementById('test-buy');
  btn.disabled = true;
  btn.innerText = 'Processing Test Buy...';

  // Clean any stuck pending payments
  Pi.getPendingPayments()
    .then(pending => {
      if (pending.length > 0) {
        console.log('Clearing pending payments...');
        pending.forEach(p => Pi.cancelPayment(p.identifier));
      }
    })
    .catch(() => {});

  Pi.createPayment({
    amount: 0.1,  // Small test amount – Pi converts to test Pi
    memo: "Canine Farming – Test Buy (Step 10 Verification)",
    metadata: { action: "test_buy" }
  }, {
    onReadyForServerApproval: (pid) => {
      console.log('Approving test payment:', pid);
      return fetch(`${BACKEND_URL}/api/payments/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: pid })
      })
      .then(res => {
        if (!res.ok) throw new Error('Approval failed');
        return res.json();
      });
    },
    onReadyForServerCompletion: (pid, txid) => {
      console.log('Completing test payment:', pid, txid);
      return fetch(`${BACKEND_URL}/api/payments/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: pid, txid })
      })
      .then(res => {
        if (!res.ok) throw new Error('Completion failed');
        return res.json();
      })
      .then(() => {
        alert('Success! Test payment completed – Step 10 should turn green!');
        btn.disabled = false;
        btn.innerText = 'Test Buy 0.1 Pi';
      })
      .catch(err => {
        console.error('Completion error:', err);
        alert('Completion failed – check console');
        btn.disabled = false;
        btn.innerText = 'Test Buy 0.1 Pi';
      });
    },
    onCancel: () => {
      alert('Test buy cancelled');
      btn.disabled = false;
      btn.innerText = 'Test Buy 0.1 Pi';
    },
    onError: (e) => {
      console.error('Test payment error:', e);
      alert('Test error: ' + (e.message || 'Unknown error'));
      btn.disabled = false;
      btn.innerText = 'Test Buy 0.1 Pi';
    }
  });
});

// SWAP (keep your original, or duplicate the test logic above for full $10 later)
document.querySelectorAll('#swap').forEach(btn => {
  btn.onclick = () => {
    btn.disabled = true;
    btn.innerText = 'Processing...';

    // Clean pending payments
    Pi.getPendingPayments()
      .then(pending => {
        if (pending.length > 0) {
          pending.forEach(p => Pi.cancelPayment(p.identifier));
        }
      })
      .catch(() => {});

    Pi.createPayment({
      amount: 10,
      memo: "Canine Farming – 1 Puppy (0.000025 $CFM)",
      metadata: { action: "buy_puppy" }
    }, {
      onReadyForServerApproval: (pid) => fetch(`${BACKEND_URL}/api/payments/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: pid })
      }),
      onReadyForServerCompletion: (pid, txid) => fetch(`${BACKEND_URL}/api/payments/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: pid, txid })
      }).then(() => {
        alert('Success! You received 1 Puppy 🐶');
        btn.disabled = false;
        btn.innerText = 'Swap $10 for 0.000025 $CFM';
      }),
      onCancel: () => {
        alert('Swap cancelled');
        btn.disabled = false;
        btn.innerText = 'Swap $10 for 0.000025 $CFM';
      },
      onError: (e) => {
        alert('Error: ' + (e.message || 'Unknown error'));
        btn.disabled = false;
        btn.innerText = 'Swap $10 for 0.000025 $CFM';
      }
    });
  };
});

// STAKE (unchanged)
document.querySelectorAll('#stake').forEach(btn => {
  btn.onclick = async () => {
    btn.disabled = true;
    btn.innerText = 'Staking...';
    try {
      const auth = await Pi.authenticate(['payments']);
      const res = await fetch(`${BACKEND_URL}/api/stake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: auth.accessToken })
      });
      const data = await res.json();
      alert(data.success ? 'Staked! 400% APY active' : data.error || 'Stake failed');
    } catch (e) {
      alert('Stake failed – check internet or wallet');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Stake $CFM';
    }
  };
});

// CLAIM (unchanged)
document.querySelectorAll('#claim').forEach(btn => {
  btn.onclick = async () => {
    btn.disabled = true;
    btn.innerText = 'Claiming...';
    try {
      const auth = await Pi.authenticate(['payments']);
      const res = await fetch(`${BACKEND_URL}/api/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: auth.accessToken })
      });
      const data = await res.json();
      alert(data.success ? `Claimed ${(data.rewarded||0).toFixed(8)} $CFM!` : data.error || 'Claim failed');
    } catch (e) {
      alert('Claim failed – check internet or wallet');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Claim Rewards';
    }
  };
});
