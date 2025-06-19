const Earning = require("../models/earning");
const User = require("../models/user");

exports.getUserEarnings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { userId };
    if (startDate && endDate) {
      query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const earnings = await Earning.find(query).sort({ timestamp: -1 });

    const totalEarnings = earnings.reduce(
      (sum, earning) => sum + earning.amount,
      0
    );
    const level1Earnings = earnings.filter((e) => e.level === 1);
    const level2Earnings = earnings.filter((e) => e.level === 2);

    res.json({
      userId,
      totalEarnings,
      level1Earnings,
      level2Earnings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getReferralTree = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Get direct referrals
    const directReferrals = await User.find({ parentId: userId });
    // For each direct referral, get their referrals
    const tree = await Promise.all(
      directReferrals.map(async (ref) => {
        const subRefs = await User.find({ parentId: ref.userId });
        return {
          userId: ref.userId,
          name: ref.name,
          isActive: ref.isActive,
          referrals: subRefs.map((s) => ({
            userId: s.userId,
            name: s.name,
            isActive: s.isActive,
          })),
        };
      })
    );
    res.json({
      userId,
      name: user.name,
      isActive: user.isActive,
      directReferrals: tree,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getEarningSources = async (req, res) => {
  try {
    const { userId } = req.params;
    const earnings = await Earning.find({ userId });
    // Group by purchaseId and level
    const sources = {};
    for (const earning of earnings) {
      if (!sources[earning.purchaseId])
        sources[earning.purchaseId] = { total: 0, levels: {} };
      sources[earning.purchaseId].total += earning.amount;
      if (!sources[earning.purchaseId].levels[earning.level])
        sources[earning.purchaseId].levels[earning.level] = 0;
      sources[earning.purchaseId].levels[earning.level] += earning.amount;
    }
    res.json({ userId, sources });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
