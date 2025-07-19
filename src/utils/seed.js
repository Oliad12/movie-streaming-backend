require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { clerkClient } = require('@clerk/clerk-sdk-node');

const prisma = new PrismaClient();

async function seedUsersFromClerk() {
  const users = await clerkClient.users.getUserList({ limit: 50 });

  for (const u of users) {
    const email = u.emailAddresses[0]?.emailAddress || '';
    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();

    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        email,
        name,
        image: u.imageUrl,
        isAdmin: false,
      },
    });
  }

  console.log(`👤 Seeded ${users.length} Clerk users.`);
}

async function seedGenres() {
  const res = await axios.get(`https://api.themoviedb.org/3/genre/movie/list`, {
    params: { api_key: process.env.TMDB_API_KEY },
  });

  const genres = res.data.genres;
  for (const genre of genres) {
    await prisma.genre.upsert({
      where: { name: genre.name },
      update: {},
      create: { name: genre.name },
    });
  }

  console.log(`🎭 Seeded ${genres.length} genres.`);
}

async function getTrailerUrl(mediaType, id) {
  try {
    const res = await axios.get(`https://api.themoviedb.org/3/${mediaType}/${id}/videos`, {
      params: { api_key: process.env.TMDB_API_KEY },
    });

    const trailer = res.data.results.find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube'
    );

    return trailer ? `https://youtube.com/watch?v=${trailer.key}` : null;
  } catch (err) {
    return null;
  }
}

async function seedMedia() {
  const mediaTypes = ['movie', 'tv'];

  for (const type of mediaTypes) {
    const res = await axios.get(`https://api.themoviedb.org/3/${type}/popular`, {
      params: { api_key: process.env.TMDB_API_KEY, page: 1 },
    });

    for (const item of res.data.results.slice(0, 10)) {
      const trailerUrl = await getTrailerUrl(type, item.id);
      const genreNames = item.genre_ids || [];

      const created = await prisma.media.create({
        data: {
          id: `${type}_${item.id}`,
          title: item.title || item.name,
          description: item.overview,
          releaseDate: new Date(item.release_date || item.first_air_date || new Date()),
          posterUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
          backdropUrl: `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`,
          trailerUrl,
          type,
          genres: {
            connect: genreNames.map((id) => ({ id })),
          },
        },
      });
    }
  }

  console.log(`🎬 Seeded popular movies & TV shows.`);
}

async function seedUserMediaActions() {
  const users = await prisma.user.findMany();
  const media = await prisma.media.findMany();

  for (const user of users) {
    const sampleMedia = media.slice(0, 5);

    for (const m of sampleMedia) {
      await prisma.watchlist.create({ data: { userId: user.id, mediaId: m.id } });
      await prisma.favorite.create({ data: { userId: user.id, mediaId: m.id } });
      await prisma.history.create({ data: { userId: user.id, mediaId: m.id } });
      await prisma.review.create({
        data: {
          userId: user.id,
          mediaId: m.id,
          rating: Math.floor(Math.random() * 5) + 1,
          text: 'This was a great movie!',
        },
      });
    }
  }

  console.log('📌 Linked users with watchlist, favorites, history, reviews.');
}

async function main() {
  console.log('🧹 Clearing old data...');
  await prisma.review.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.history.deleteMany();
  await prisma.media.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.user.deleteMany();

  console.log('👥 Seeding Clerk users...');
  await seedUsersFromClerk();

  console.log('🎭 Seeding genres...');
  await seedGenres();

  console.log('🎬 Seeding media...');
  await seedMedia();

  console.log('📌 Seeding user actions...');
  await seedUserMediaActions();

  console.log('✅ All done!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
