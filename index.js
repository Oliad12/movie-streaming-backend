const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mediaRouters = require('./src/routes/media');
const watchlistRouters = require('./src/routes/watchlist');
const paymentRouters = require('./src/routes/payment')
const historyRouters = require('./src/routes/history');
const favoritesRouters = require('./src/routes/favorites');
const reviewRouters = require('./src/routes/review');
const subscriptionRouters = require('./src/routes/subscription');
const mediaRoutes = require('./src/routes/admin/mediaRoutes');
const userRoutes = require('./src/routes/user');
const { clerkMiddleware } = require('./src/middleware/auth');

const app = express();
const allowedOrigins = ['http://localhost:3000']



// Routes
app.use('/api/admin/media', mediaRoutes);
app.use('/api/media', mediaRouters);
app.use('/api/watchlist', watchlistRouters);
app.use('/api/payment', paymentRouters);
app.use('/api/history', historyRouters);
app.use('/api/favorites', favoritesRouters);
app.use('api/review', reviewRouters);
app.use('api/subscription', subscriptionRouters);
app.use('/api/user', userRoutes);

app.use(cookieParser());
app.use(cors({origin: allowedOrigins, Credentials: true}));
app.use(express.json());
app.get('/', (req, res) => res.send('Movie API is running...'));
app.use(clerkMiddleware);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {console.log(`Server running on http://localhost:${PORT}`)});
