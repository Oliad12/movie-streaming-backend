const prisma = require('../lib/prisma');

function getUserId(req) {
  return req.auth?.userId;
}

// Get reviews for a media item
exports.getReviewsForMedia = async (req, res) => {
  try {
    const mediaId = parseInt(req.params.mediaId);

    const reviews = await prisma.review.findMany({
      where: { mediaId },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reviews);
  } catch (err) {
    console.error('Fetch reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Add a review
exports.addReview = async (req, res) => {
  try {
    const externalId = getUserId(req);
    const { mediaId, rating, comment } = req.body;

    const user = await prisma.user.findUnique({ where: { externalId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        mediaId,
        rating,
        comment,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    res.status(201).json(review);
  } catch (err) {
    console.error('Add review error:', err);
    res.status(500).json({ error: 'Failed to add review' });
  }
};

// Delete review (optional: only owner or admin)
exports.deleteReview = async (req, res) => {
  try {
    const externalId = getUserId(req);
    const reviewId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({ where: { externalId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.userId !== user.id)
      return res.status(403).json({ error: 'Not authorized' });

    await prisma.review.delete({ where: { id: reviewId } });

    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
