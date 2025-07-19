const prisma = require('../lib/prisma');
const { getDbUser } = require('../middlewares/auth');

// 📥 GET all history items
exports.getHistory = async (req, res) => {
  try {
    const externalId = req.auth.userId;
    const user = await getDbUser(externalId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const hitory = await prisma.history.findMany({
      where: { userId: user.id },
      include: { media: true },
      orderBy: { watchedAt: 'desc' },
    });

    res.json(hitory);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

// ➕ POST: Add media to history (idempotent)
exports.addToHistory = async (req, res) => {
  try {
    const externalId = req.auth.userId;
    const { mediaId } = req.body;
    if (!mediaId) return res.status(400).json({ error: 'mediaId is required' });

    const user = await getDbUser(externalId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) return res.status(404).json({ error: 'Media not found' });

    const existing = await prisma.history.findUnique({
      where: {
        userId_mediaId: {
          userId: user.id,
          mediaId,
        },
      },
    });

    if (existing) {
      const updated = await prisma.history.update({
        where: { id: existing.id },
        data: { watchedAt: new Date() },
        include: { media: true },
      });
      return res.json(updated);
    }

    const newItem = await prisma.history.create({
      data: {
        userId: user.id,
        mediaId,
        watchedAt: new Date(),
      },
      include: { media: true },
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Add to history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ❌ DELETE: Remove one media from history
exports.removeFromHistory = async (req, res) => {
  try {
    const externalId = req.auth.userId;
    const mediaId = parseInt(req.params.mediaId, 10);
    if (!mediaId) return res.status(400).json({ error: 'Valid mediaId required' });

    const user = await getDbUser(externalId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const deleted = await prisma.history.deleteMany({
      where: { userId: user.id, mediaId },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'History item not found' });
    }

    res.json({ message: 'Removed from history' });
  } catch (error) {
    console.error('Remove from history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🧹 DELETE: Clear all history
exports.clearHistory = async (req, res) => {
  try {
    const externalId = req.auth.userId;
    const user = await getDbUser(externalId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.history.deleteMany({ where: { userId: user.id } });

    res.json({ message: 'History cleared' });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
