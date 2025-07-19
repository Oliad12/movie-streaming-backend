const prisma = require('../utils/prisma');
const { fetchTMDBData, getImageUrl } = require('../utils/tmdb');

// ✅ Sync movies & TV shows
exports.syncPopularMedia = async (req, res) => {
  try {
    const [movies, tvShows] = await Promise.all([
      fetchTMDBData('movie', 'popular'),
      fetchTMDBData('tv', 'popular'),
    ]);

    const combined = [...movies, ...tvShows];

    for (const item of combined) {
      const isMovie = item.title !== undefined;

      await prisma.media.upsert({
        where: { tmdbId: item.id },
        update: {},
        create: {
          tmdbId: item.id,
          title: isMovie ? item.title : item.name,
          description: item.overview,
          type: isMovie ? 'MOVIE' : 'TV',
          releaseYear: (item.release_date || item.first_air_date)?.split('-')[0],
          posterUrl: getImageUrl(item.poster_path),
          backdropUrl: getImageUrl(item.backdrop_path, 'w780'),
          genreIds: item.genre_ids?.join(',') || '',
        },
      });
    }

    res.status(200).json({ message: 'TMDB sync completed successfully' });
  } catch (err) {
    console.error('TMDB Sync Error:', err);
    res.status(500).json({ error: 'Failed to sync TMDB media' });
  }
};
// Get all media
exports.getAllMedia = async (req, res) => {
  const { type, search, page = 1, limit = 20  } = req.query; // ?type=MOVIE or ?type=TV
   const {media} = await tmdb();

  try {
    const media = await prisma.media.findMany({
      where: type ? { type } : {},
      include: { genre: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(media);
  } catch (err) {
    console.error('Error fetching media:', err);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
};

// Get one media
exports.getMediaById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        genre: true,
        reviews: true,
      },
    });
    if (!media) return res.status(404).json({ error: 'Media not found' });
    res.json(media);
  } catch (err) {
    console.error('Error fetching media:', err);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
};

// Create media
exports.createMedia = async (req, res) => {
  const {
    title,
    description,
    type,
    releaseYear,
    firstAirYear,
    seasons,
    duration,
    posterUrl,
    trailerUrl,
    videoUrl,
    genreId,
  } = req.body;

  if (!title || !type || !posterUrl || !genreId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newMedia = await prisma.media.create({
      data: {
        title,
        description,
        type,
        releaseYear,
        firstAirYear,
        seasons,
        duration,
        posterUrl,
        trailerUrl,
        videoUrl,
        genreId,
      },
    });
    res.status(201).json(newMedia);
  } catch (err) {
    console.error('Error creating media:', err);
    res.status(500).json({ error: 'Failed to create media' });
  }
};

// Delete media
exports.deleteMedia = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.media.delete({ where: { id } });
    res.json({ message: 'Media deleted' });
  } catch (err) {
    console.error('Error deleting media:', err);
    res.status(500).json({ error: 'Failed to delete media' });
  }
};
