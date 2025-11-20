module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  res.status(200).json({
    success: true,
    rewarded: 0.000025,
    total: 0.00005,
    message: 'Claim successful!'
  });
};
