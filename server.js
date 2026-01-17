require('dotenv').config({ quiet: true });
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.PI_API_KEY;
const BASE_URL = 'https://api.testnet.minepi.com/v2';

let circulatingSupply = 250;
const TOTAL_SUPPLY = 10000000;
const APY = 4.0;
const MIN_HOLDING = 0.000025;
const STAKES = {};  // uid → { startDate, claimedQuarters, totalClaimed, active, swapped }

// === NEW: Pi SDK Payment Endpoints (fixes timeout) ===

// Instant approval response (prevents "Payment Expired")
app.post('/payments/approve', (req, res) => {
  const { paymentId } = req.body;

  console.log('Pi SDK requesting approval for payment:', paymentId);

  // Respond IMMEDIATELY to stop Pi SDK timeout
  res.status(200).json({ success: true });
});

// Completion callback (called after user approves in Pi app)
app.post('/payments/complete', async (req, res) => {
  const { paymentId, txid } = req.body;

  console.log('Pi SDK payment completed:', { paymentId, txid });

  try {
    // Verify payment with Pi API (optional but recommended)
    const paymentVerification = await axios.get(`${BASE_URL}/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });

    if (paymentVerification.data.status !== 'completed') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Credit 0.000025 $CFM to user (use your real transfer logic here)
    const uid = paymentVerification.data.user.uid;  // Get user from payment
    await transferCFM(uid, 0.000025, 'Swap reward');

    // Mark as swapped (if not already)
    if (!STAKES[uid]?.swapped) {
      STAKES[uid] = { ...STAKES[uid], swapped: true };
    }

    circulatingSupply += 0.000025;

    res.status(200).json({ success: true, cfm: 0.000025 });
  } catch (err) {
    console.error('Payment completion error:', err.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// === Existing endpoints (unchanged for now) ===
app.post('/swap', async (req, res) => {
  const { token } = req.body;
  const user = await verifyUser(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (STAKES[user.uid]?.swapped) return res.status(400).json({ error: 'Already swapped once' });

  const balance = await getCFMBalance(user.uid);
  if (balance < MIN_HOLDING) return res.status(400).json({ error: 'Insufficient Pi for swap' });

  await transferCFM(user.uid, 0.000025, 'Swap reward');
  STAKES[user.uid] = { ...STAKES[user.uid], swapped: true };

  circulatingSupply += 0.000025;
  res.json({ success: true, cfm: 0.000025 });
});

app.post('/stake', async (req, res) => {
  const { token } = req.body;
  const user = await verifyUser(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (!STAKES[user.uid]?.swapped) return res.status(400).json({ error: 'Swap first' });
  if (STAKES[user.uid]?.staked) return res.status(400).json({ error: 'Already staked' });

  const balance = await getCFMBalance(user.uid);
  if (balance < MIN_HOLDING) return res.status(400).json({ error: 'Insufficient $CFM to stake' });

  STAKES[user.uid].staked = true;
  STAKES[user.uid].startDate = Date.now();
  STAKES[user.uid].claimedQuarters = 0;
  STAKES[user.uid].totalClaimed = 0;
  STAKES[user.uid].active = true;

  res.json({ success: true, message: 'Staked! 400% APY active' });
});

app.post('/claim', async (req, res) => {
  const { token } = req.body;
  const user = await verifyUser(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const staker = STAKES[user.uid];
  if (!staker || !staker.staked || !staker.active) return res.status(400).json({ error: 'Not eligible' });

  const quartersElapsed = Math.floor((Date.now() - staker.startDate) / (3 * 30 * 24 * 60 * 60 * 1000));
  const eligibleQuarters = quartersElapsed - staker.claimedQuarters;

  if (eligibleQuarters <= 0) return res.status(400).json({ error: 'No rewards ready' });

  let reward = 0;
  for (let q = 1; q <= eligibleQuarters; q++) {
    const year = Math.floor((staker.claimedQuarters + q - 1) / 4) + 1;
    reward += year === 1 ? 0.000025 : 0.0001 * (APY / 100);
  }

  if (staker.totalClaimed + reward >= 0.999975) {
    reward = 0.999975 - staker.totalClaimed;
    staker.active = false;
  }

  await transferCFM(user.uid, reward, 'Staking reward');

  staker.claimedQuarters += eligibleQuarters;
  staker.totalClaimed += reward;

  res.json({ success: true, rewarded: reward, total: staker.totalClaimed + 0.000025, graduated: !staker.active });
});

// Mock helpers (replace with real Pi API calls later)
async function verifyUser(token) {
  try {
    const res = await axios.post(`${BASE_URL}/auth/verify`, { token }, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    return res.data.user;
  } catch {
    return { uid: 'test_uid' }; // Mock for testnet
  }
}

async function getCFMBalance(uid) {
  try {
    const res = await axios.get(`${BASE_URL}/wallet/balance?uid=${uid}&currency=CFM`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    return parseFloat(res.data.balance);
  } catch {
    return 0.00003; // Mock
  }
}

async function transferCFM(uid, amount, memo) {
  console.log(`Transferred ${amount} $CFM to ${uid}: ${memo}`);
  // Replace with real Pi transfer API call later
}

app.listen(3000, () => console.log('Canine Farming Backend on Testnet'));
