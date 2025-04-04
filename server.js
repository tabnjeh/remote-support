const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 3000;

require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DAILY_API_KEY = process.env.DAILY_API_KEY;

app.post('/create-room', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.daily.co/v1/rooms',
      {
        properties: {
          enable_chat: true,
          eject_at_room_exp: false // 🔒 users won't be kicked
          // no exp field = room doesn't expire
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
  } catch (err) {
    console.error('Error creating room:', err.response?.data || err.message);
    res.status(500).json({ error: 'Room creation failed' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
