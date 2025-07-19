const clerk = require('@clerk/clerk-sdk-node');

module.exports = async function requireAdmin(req, res, next) {
  const { userId } = req.auth;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = await clerk.users.getUser(userId);
  const role = user.publicMetadata.role;

  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admins only' });
  }

  next();
};
