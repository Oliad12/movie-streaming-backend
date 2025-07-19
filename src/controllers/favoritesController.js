const prisma = require('../lib/prisma');
const { getDbUser } = require('../middlewares/auth');

// GET /api/favorites
exports.getFavorites = async (req, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: { media: true },
      orderBy: { addedAt: 'desc' },
    });

    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/favorites
exports.addToFavorites = async (req, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    const { mediaId } = req.body;

    if (!mediaId) return res.status(400).json({ error: 'mediaId is required' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) return res.status(404).json({ error: 'Media not found' });

    const exists = await prisma.favorite.findUnique({
      where: {
        userId_mediaId: {
          userId: user.id,
          mediaId,
        },
      },
    });

    if (exists) return res.status(409).json({ error: 'Already in favorites' });

    const favoriteItem = await prisma.favorite.create({
      data: {
        userId: user.id,
        mediaId,
      },
      include: { media: true },
    });

    res.status(201).json(favoriteItem);
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/favorites/:mediaId
exports.removeFromFavorites = async (req, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    const mediaId = parseInt(req.params.mediaId, 10);

    if (!mediaId) return res.status(400).json({ error: 'Valid mediaId is required' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const deleted = await prisma.favorite.deleteMany({
      where: {
        userId: user.id,
        mediaId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Favorite item not found' });
    }

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
