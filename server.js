const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // ✅ Serves agent.html & support.html

const DAILY_API_KEY = process.env.DAILY_API_KEY;

// 🔹 Create a non-expiring Daily.co room
app.post('/create-room', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.daily.co/v1/rooms',
      {
        properties: {
          enable_chat: true,
          eject_at_room_exp: false, // ✅ Keeps users in even if room is deleted later
          start_video_off: true,
          start_audio_off: true
        }
      },
      {
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ url: response.data.url });
  } catch (error) {
    console.error('Error creating room:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// 🔹 Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
