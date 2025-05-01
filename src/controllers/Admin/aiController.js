const AIRecommendation = require('../models/AIRecommendation');

exports.getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const recommendations = await AIRecommendation.findAll({ where: { userId } });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recommendations', error });
  }
};
