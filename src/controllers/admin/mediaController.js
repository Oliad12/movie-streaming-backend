const prisma = require('../../lib/prisma'); 
// GET all media
exports.getAllMedia = async (req, res) => {
  try {
    const media = await prisma.media.findMany();
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch media.' });
  }
};

// GET single media by ID
exports.getMediaById = async (req, res) => {
  try {
    const media = await prisma.media.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!media) return res.status(404).json({ error: 'Media not found.' });
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch media.' });
  }
};

// UPDATE media by ID
exports.updateMedia = async (req, res) => {
  try {
    const updated = await prisma.media.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update media.' });
  }
};

// DELETE media by ID
exports.deleteMedia = async (req, res) => {
  try {
    await prisma.media.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete media.' });
  }
};
// POST: Create new media
exports.createMedia = async (req, res) => {
  try {
    const { title, description, genre, type, releaseDate, posterUrl } = req.body;

    const newMedia = await prisma.media.create({
      data: {
        title,
        description,
        genre,
        type, // 'movie' or 'tv'
        releaseDate: new Date(releaseDate),
        posterUrl,
      },
    });

    res.status(201).json(newMedia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create media.' });
  }
};
