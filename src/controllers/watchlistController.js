const prisma = require('../lib/prisma');
const { getDbUser } = require('../middlewares/auth');

// GET /api/watchlist
exports.getWatchlist = async (req, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const items = await prisma.watchlist.findMany({
      where: { userId: user.id },
      include: { media: true },
      orderBy: { addedAt: 'desc' },
    });

    res.json(items);
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/watchlist
exports.addToWatchlist = async (req, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    const { mediaId } = req.body;

    if (!mediaId) return res.status(400).json({ error: 'mediaId is required' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) return res.status(404).json({ error: 'Media not found' });

    const exists = await prisma.watchlist.findUnique({
      where: {
        userId_mediaId: {
          userId: user.id,
          mediaId,
        },
      },
    });

    if (exists) return res.status(409).json({ error: 'Already in watchlist' });

    const watchlistItem = await prisma.watchlist.create({
      data: {
        userId: user.id,
        mediaId,
      },
      include: { media: true },
    });

    res.status(201).json(watchlistItem);
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/watchlist/:mediaId
exports.removeFromWatchlist = async (req, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    const mediaId = parseInt(req.params.mediaId, 10);

    if (!mediaId) return res.status(400).json({ error: 'Valid mediaId is required' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const deleted = await prisma.watchlist.deleteMany({
      where: {
        userId: user.id,
        mediaId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Item not found in watchlist' });
    }

    res.json({ message: 'Removed from watchlist' });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
