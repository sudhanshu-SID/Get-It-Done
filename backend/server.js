require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes Hub
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/index');
const questRoutes = require('./routes/quests');
app.use('/api/auth', authRoutes);
app.use('/api/quests', questRoutes);
app.use('/api', apiRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected Successfully');
    try {
      const collection = mongoose.connection.collection('dailyrecords');
      const indexes = await collection.indexes();
      if (indexes.some(idx => idx.name === 'date_1')) {
        await collection.dropIndex('date_1');
        console.log('Cleaned up legacy unique index "date_1"');
      }
    } catch (_) {}
  })
  .catch((err) => console.error('MongoDB Connection Error:', err));

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Keep-Alive Self-Ping: Pings every 14 minutes to prevent Render Free Tier from idling out (15 min limit)
  const PING_INTERVAL_MS = 14 * 60 * 1000;
  const backendUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;

  if (backendUrl) {
    const pingEndpoint = `${backendUrl.replace(/\/$/, '')}/api/health`;
    console.log(`[Keep-Alive] Initialized self-ping for ${pingEndpoint} every 14 minutes`);

    setInterval(async () => {
      try {
        await fetch(pingEndpoint);
        console.log(`[Keep-Alive] Self-ping succeeded at ${new Date().toISOString()}`);
      } catch (err) {
        console.debug('[Keep-Alive] Self-ping warning:', err.message);
      }
    }, PING_INTERVAL_MS);
  }
});
