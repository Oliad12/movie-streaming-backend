const { clerkClient } = require('@clerk/clerk-sdk-node');
const { requireAuth, ClerkExpressWithAuth } = require('@clerk/express');
const prisma = require('../lib/prisma');

module.exports.requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const session = await clerkClient.sessions.verifySession(token);
    req.clerkUserId = session.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports.getDbUser = async (clerkId) => {
  let user = await prisma.user.findUnique({ where: { externalId: clerkId } });
  if (!user) {
    const clerkUser = await clerkClient.users.getUser(clerkId);
    user = await prisma.user.create({
      data: {
        externalId: clerkId,
        email: clerkUser.emailAddresses[0].emailAddress,
        name: clerkUser.username,
        image: clerkUser.imageUrl,
        role: 'USER',
      },
    });
  }
  return user;
};
module.exports = {
  requireAuth,             
  ClerkExpressWithAuth,      
  getDbUser,
};