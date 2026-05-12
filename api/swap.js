module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  res.status(200).json({
    success: true,
    cfm: 0.000025,
    message: 'You received 1 Puppy (0.000025 $CFM)!'
  });
};
