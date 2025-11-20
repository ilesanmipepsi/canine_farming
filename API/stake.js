module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Simple success for now — we’ll upgrade with full logic later
  res.status(200).json({
    success: true,
    message: 'Staked successfully! 400% APY active'
  });
};
