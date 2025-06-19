const Purchase = require("../models/purchase");
const Earning = require("../models/earning");
const User = require("../models/user");
const { v4: uuidv4 } = require("uuid");

exports.recordPurchase = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;

    if (amount <= 1000) {
      return res
        .status(400)
        .json({ message: "Purchase amount must be greater than 1000Rs" });
    }

    const purchaseId = uuidv4();
    const newPurchase = new Purchase({
      purchaseId,
      userId,
      amount,
      description,
      timestamp: new Date(),
    });

    await newPurchase.save();

    const user = await User.findOne({ userId });
    if (!user || !user.isActive) {
      return res.status(404).json({ message: "User not found or inactive" });
    }

    if (user.parentId) {
      const parentUser = await User.findOne({ userId: user.parentId });
      if (parentUser && parentUser.isActive) {
        const level1Earning = amount * 0.05;
        const earningId1 = uuidv4();
        const newEarning1 = new Earning({
          earningId: earningId1,
          userId: parentUser.userId,
          sourceUserId: user.userId,
          purchaseId,
          amount: level1Earning,
          level: 1,
          timestamp: new Date(),
        });
        await newEarning1.save();

        req.io.to(parentUser.userId).emit("earningUpdate", {
          userId: parentUser.userId,
          amount: level1Earning,
          level: 1,
          purchaseId,
          timestamp: new Date(),
        });

        if (parentUser.parentId) {
          const grandparentUser = await User.findOne({
            userId: parentUser.parentId,
          });
          if (grandparentUser && grandparentUser.isActive) {
            const level2Earning = amount * 0.01;
            const earningId2 = uuidv4();
            const newEarning2 = new Earning({
              earningId: earningId2,
              userId: grandparentUser.userId,
              sourceUserId: user.userId,
              purchaseId,
              amount: level2Earning,
              level: 2,
              timestamp: new Date(),
            });
            await newEarning2.save();

            req.io.to(grandparentUser.userId).emit("earningUpdate", {
              userId: grandparentUser.userId,
              amount: level2Earning,
              level: 2,
              purchaseId,
              timestamp: new Date(),
            });
          }
        }
      }
    }

    res.status(201).json({
      purchaseId,
      userId,
      amount,
      profitDistributed: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
