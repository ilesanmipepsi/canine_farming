const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const BigNumber = require('bignumber.js');

const app = express();

app.use(cors());
app.use(express.json());

const BASE_URL = "https://api.minepi.com";
const API_KEY = process.env.PI_API_KEY;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log("🚀 Supabase connected successfully");
} else {
  console.warn("⚠️ Supabase credentials missing - running in fallback mode");
}

if (!API_KEY) console.warn("⚠️ PI_API_KEY is missing!");

// Constants
const REWARD_PER_MS = new BigNumber('0.000000000031709');
const MAX_WALLET_CAP = new BigNumber('1.000000000000');

// ===================== USER STATUS =====================
app.get('/api/user-status', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: "Missing username" });

  if (!supabase) {
    return res.json({ hasActivated: false, currentCfmBalance: 0.000025 });
  }

  try {
    const { data: user, error } = await supabase
      .from('pioneer_simulation_wallets')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.json({ hasActivated: false });
    }

    res.json({
      hasActivated: true,
      currentCfmBalance: parseFloat(user.current_cfm_balance),
      isCapped: !user.is_active_eligible
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== PAYMENT HANDLING =====================
app.post('/api/payments/approve', async (req, res) => {
  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ error: "Missing paymentId" });

  try {
    const response = await axios.post(`${BASE_URL}/v2/payments/${paymentId}/approve`, {}, {
      headers: { 
        'Authorization': `Key ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Approval Error:', err.response?.data || err.message);
    res.status(500).json({ error: "Approval failed" });
  }
});

app.post('/api/payments/complete', async (req, res) => {
  const { paymentId, txid, username } = req.body;
  if (!paymentId) return res.status(400).json({ error: "Missing paymentId" });

  try {
    const response = await axios.post(`${BASE_URL}/v2/payments/${paymentId}/complete`, { txid }, {
      headers: { 
        'Authorization': `Key ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (supabase && username) {
      await supabase
        .from('pioneer_simulation_wallets')
        .upsert({
          username: username,
          current_cfm_balance: 0.000025000000,
          last_update_time: new Date().toISOString(),
          is_active_eligible: true
        }, { onConflict: 'username' });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Completion Error:', err.response?.data || err.message);
    res.status(500).json({ error: "Completion failed" });
  }
});

// ===================== OTHER ACTIONS =====================
app.post('/api/stake', (req, res) => {
  res.json({ success: true, message: 'Successfully staked $CFM.' });
});

app.post('/api/swap', (req, res) => {
  res.json({ success: true, message: 'Minting complete.' });
});

app.post('/api/claim', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Missing username" });

  if (!supabase) {
    return res.json({ success: true, message: 'Harvest processed (sandbox mode).' });
  }

  try {
    const { data: user, error } = await supabase
      .from('pioneer_simulation_wallets')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) return res.status(404).json({ error: "User not found" });
    if (!user.is_active_eligible) {
      return res.json({ success: false, message: "Wallet has reached 1.0 CFM limit." });
    }

    const now = new Date();
    const lastUpdate = new Date(user.last_update_time);
    const msElapsed = now.getTime() - lastUpdate.getTime();

    if (msElapsed <= 0) {
      return res.json({ success: true, updated_balance: user.current_cfm_balance, message: "Nothing to harvest." });
    }

    const calculatedReward = REWARD_PER_MS.multipliedBy(msElapsed);
    let updatedBalance = new BigNumber(user.current_cfm_balance).plus(calculatedReward);
    let keepEligible = true;

    if (updatedBalance.gte(MAX_WALLET_CAP)) {
      updatedBalance = MAX_WALLET_CAP;
      keepEligible = false;
    }

    await supabase
      .from('pioneer_simulation_wallets')
      .update({
        current_cfm_balance: updatedBalance.toNumber(),
        last_update_time: now.toISOString(),
        is_active_eligible: keepEligible
      })
      .eq('username', username);

    res.json({ 
      success: true, 
      updated_balance: updatedBalance.toNumber(),
      message: keepEligible ? "Harvest successful!" : "Wallet reached maximum limit."
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Canine Farming Protocol Backend Running'));

module.exports = app;
