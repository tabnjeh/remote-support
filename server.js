const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { AccessToken } = require('twilio').jwt;
const VideoGrant = AccessToken.VideoGrant;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Use environment variables from Render
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID;
const TWILIO_API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ✅ Create Twilio room + tokens
app.post('/create-room', (req, res) => {
  const roomName = uuidv4();

  const agentToken = new AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET,
    { identity: 'agent' }
  );
  agentToken.addGrant(new VideoGrant({ room: roomName }));

  const customerToken = new AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET,
    { identity: 'customer' }
  );
  customerToken.addGrant(new VideoGrant({ room: roomName }));

  console.log("✅ Twilio Room created:", roomName);

  res.json({
    roomName,
    agentToken: agentToken.toJwt(),
    customerToken: customerToken.toJwt()
  });
});

app.get('/', (req, res) => {
  res.redirect('/agent.html');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
