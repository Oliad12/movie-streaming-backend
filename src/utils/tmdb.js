
const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

function getImageUrl(path, size = 'w500') {
  return path ? `${TMDB_IMAGE_BASE}${size}${path}` : null;
}

async function fetchTMDBData(type = 'movie', category = 'popular') {
  const url = `${BASE_URL}/${type}/${category}`;
  const res = await axios.get(url, {
    params: {
      api_key: TMDB_API_KEY,
      language: 'en-US',
    },
  });
  return res.data.results;
}

async function fetchById(type, id) {
  const url = `${BASE_URL}/${type}/${id}`;
  const res = await axios.get(url, {
    params: { api_key: TMDB_API_KEY, language: 'en-US' },
  });
  return res.data;
}

module.exports = {
  fetchTMDBData,
  fetchById,
  getImageUrl,
};
