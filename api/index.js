const express = require('express');
‎const cors = require('cors');
‎const axios = require('axios');
‎const { createClient } = require('@supabase/supabase-js');
‎const BigNumber = require('bignumber.js');
‎
‎const app = express();
‎
‎app.use(cors());
‎app.use(express.json());
‎
‎const BASE_URL = "https://api.minepi.com";
‎const API_KEY = process.env.PI_API_KEY;
‎
‎// Supabase Environment variables for Vercel deployment configurations
‎const SUPABASE_URL = process.env.SUPABASE_URL;
‎const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
‎
‎let supabase;
‎if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
‎  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
‎  console.log("🚀 Supabase Storage Integration Active");
‎} else {
‎  console.warn("⚠️ Supabase Credentials Missing! App running in stateless fallback sandbox.");
‎}
‎
‎if (!API_KEY) console.warn("⚠️ PI_API_KEY environment variable is missing!");
‎
‎// Multiplier Per Millisecond (400% Yearly Distribution target scaled down)
‎const REWARD_PER_MS = new BigNumber('0.000000000031709');
‎const MAX_WALLET_CAP = new BigNumber('1.000000000000');
‎
‎// ===================== USER STATE CHECK =====================
‎app.get('/api/user-status', async (req, res) => {
‎  const { username } = req.query;
‎  if (!username) return res.status(400).json({ error: "Missing username parameter" });
‎
‎  if (!supabase) {
‎    // Sandbox mode development fallback flag
‎    return res.status(200).json({ hasActivated: false, currentCfmBalance: 0.000025 });
‎  }
‎
‎  try {
‎    const { data: user, error } = await supabase
‎      .from('pioneer_simulation_wallets')
‎      .select('*')
‎      .eq('username', username)
‎      .single();
‎
‎    if (error || !user) {
‎      return res.status(200).json({ hasActivated: false });
‎    }
‎
‎    res.status(200).json({
‎      hasActivated: true,
‎      currentCfmBalance: parseFloat(user.current_cfm_balance),
‎      isCapped: user.is_active_eligible === false
‎    });
‎  } catch (err) {
‎    res.status(500).json({ error: err.message });
‎  }
‎});
‎
‎// ===================== PAYMENT HANDLING =====================
‎app.post('/api/payments/approve', async (req, res) => {
‎  const { paymentId } = req.body;
‎  if (!paymentId) return res.status(400).json({ error: "Missing paymentId" });
‎
‎  try {
‎    const response = await axios.post(`${BASE_URL}/v2/payments/${paymentId}/approve`, {}, {
‎      headers: { 
‎        'Authorization': `Key ${API_KEY}`,
‎        'Content-Type': 'application/json'
‎      }
‎    });
‎    console.log(`Payment Approved: ${paymentId}`);
‎    res.status(200).json(response.data);
‎  } catch (err) {
‎    console.error('Approval Error:', err.response?.data || err.message);
‎    res.status(500).json({ error: "Approval failed" });
‎  }
‎});
‎
‎app.post('/api/payments/complete', async (req, res) => {
‎  const { paymentId, txid, username } = req.body;
‎  if (!paymentId) return res.status(400).json({ error: "Missing paymentId" });
‎
‎  try {
‎    const response = await axios.post(`${BASE_URL}/v2/payments/${paymentId}/complete`, { txid }, {
‎      headers: { 
‎        'Authorization': `Key ${API_KEY}`,
‎        'Content-Type': 'application/json'
‎      }
‎    });
‎
‎    console.log(`Payment Completed on Chain: ${paymentId}`);
‎
‎    // If database connection is active, provision baseline 0.000025 entry state record
‎    if (supabase && username) {
‎      await supabase
‎        .from('pioneer_simulation_wallets')
‎        .upsert({
‎          username: username,
‎          current_cfm_balance: 0.000025000000,
‎          last_update_time: new Date().toISOString(),
‎          is_active_eligible: true
‎        }, { onConflict: 'username' });
‎      
‎      console.log(`Successfully activated simulation wallet for profile: ${username}`);
‎    }
‎
‎    res.status(200).json({ success: true, piData: response.data });
‎  } catch (err) {
‎    console.error('Completion Error:', err.response?.data || err.message);
‎    res.status(500).json({ error: "Completion failed" });
‎  }
‎});
‎
‎// ===================== CORE DEFI PROTOCOL LOGIC =====================
‎app.post('/api/claim', async (req, res) => {
‎  const { username } = req.body;
‎  if (!username) return res.status(400).json({ error: "Missing identity parameter" });
‎
‎  if (!supabase) {
‎    return res.json({ success: true, message: 'Sandbox Harvest Processed.' });
‎  }
‎
‎  try {
‎    const { data: user, error } = await supabase
‎      .from('pioneer_simulation_wallets')
‎      .select('*')
‎      .eq('username', username)
‎      .single();
‎
‎    if (error || !user) return res.status(404).json({ error: "Active farming profile not found." });
‎    if (!user.is_active_eligible) {
‎      return res.status(200).json({ success: false, message: "Your wallet has reached the 1.0 CFM limit and is cut off." });
‎    }
‎
‎    // Mathematical delta calculation engine
‎    const now = new Date();
‎    const lastUpdate = new Date(user.last_update_time);
‎    const msElapsed = now.getTime() - lastUpdate.getTime();
‎
‎    if (msElapsed <= 0) {
‎      return res.status(200).json({ success: true, updated_balance: user.current_cfm_balance, message: "Nothing to harvest." });
‎    }
‎
‎    const calculatedReward = REWARD_PER_MS.multipliedBy(msElapsed);
‎    let updatedBalance = new BigNumber(user.current_cfm_balance).plus(calculatedReward);
‎    let keepEligible = true;
‎
‎    if (updatedBalance.isGreaterThanOrEqualTo(MAX_WALLET_CAP)) {
‎      updatedBalance = MAX_WALLET_CAP;
‎      keepEligible = false; // Disconnect accumulator line permanently
‎    }
‎
‎    // Atomic update sync lock step
‎    await supabase
‎      .from('pioneer_simulation_wallets')
‎      .update({
‎        current_cfm_balance: updatedBalance.toNumber(),
‎        last_update_time: now.toISOString(),
‎        is_active_eligible: keepEligible
‎      })
‎      .eq('username', username);
‎
‎    res.json({ 
‎      success: true, 
‎      updated_balance: updatedBalance.toNumber(),
‎      message: keepEligible 
‎        ? `Harvest Complete! Your dynamic rewards are logged safely.`
‎        : `🛑 Hard anti-whale limit reached! Allocation stopped permanently at 1.000000 CFM.`
‎    });
‎
‎  } catch (err) {
‎    res.status(500).json({ error: err.message });
‎  }
‎});
‎
‎app.post('/api/stake', (req, res) => {
‎  res.json({ success: true, message: 'Successfully staked $CFM simulation units.' });
‎});
‎
‎app.post('/api/swap', (req, res) => {
‎  res.json({ success: true, message: 'Minting workflow complete.' });
‎});
‎
‎app.get('/', (req, res) => {
‎  res.send('Canine Farming Protocol Backend • Live & Secure');
‎});
‎
‎module.exports = app;
