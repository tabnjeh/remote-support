const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // ✅ Serves agent.html and support.html

const DAILY_API_KEY = process.env.DAILY_API_KEY;

// ✅ Create a Daily room (non-expiring) with error logging
app.post('/create-room', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.daily.co/v1/rooms',
      {
        properties: {
          enable_chat: true,
          eject_at_room_exp: false,
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

    console.log("✅ Room created:", response.data.url); // success log
    res.json({ url: response.data.url });
  } catch (error) {
    console.error('❌ Error creating room:', error?.response?.data || error.message); // error log
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Optional: Redirect root path to agent.html
app.get('/', (req, res) => {
  res.redirect('/agent.html');
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
