const prisma = require('../lib/prisma');
const { getDbUser } = require('../middlewares/auth');

// 🚀 Get current user's active subscription
exports.getSubscription = async (req, res) => {
  try {
    const externalId = req.auth.userId;
    const user = await getDbUser(externalId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { startDate: 'desc' },
    });

    res.json(subscription || {});
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ➕ Create new subscription
exports.createSubscription = async (req, res) => {
  try {
    const externalId = req.auth.userId;
    const user = await getDbUser(externalId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { startDate, endDate, status } = req.body;

    const newSubscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
      },
    });

    res.status(201).json(newSubscription);
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ❌ Cancel current subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const externalId = req.auth.userId;
    const user = await getDbUser(externalId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.subscription.updateMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      data: {
        status: 'CANCELLED',
        endDate: new Date(),
      },
    });

    res.json({ message: 'Subscription cancelled', updated });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
