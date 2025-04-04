const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { AccessToken } = require('twilio').jwt;
const VideoGrant = AccessToken.VideoGrant;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID;
const TWILIO_API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;

const customerTokens = {};

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

  customerTokens[roomName] = customerToken.toJwt();

  console.log("✅ Twilio Room created:", roomName);

  res.json({
    roomName,
    agentToken: agentToken.toJwt(),
    customerLink: `/join?room=${roomName}`
  });
});

app.get('/join', (req, res) => {
  const room = req.query.room;
  const token = customerTokens[room];

  if (!room || !token) {
    return res.status(404).send("Invalid or expired room.");
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Support Call</title>
      <script src="https://sdk.twilio.com/js/video/releases/2.27.0/twilio-video.min.js"></script>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 text-center">
      <main class="max-w-2xl mx-auto mt-10 p-4 bg-white rounded shadow">
        <h1 class="text-2xl font-bold mb-4">📞 Connecting you to support...</h1>
        <button id="switchCamera" class="bg-blue-600 text-white px-4 py-2 rounded mb-4">Switch Camera</button>
        <div id="video-container" class="rounded border h-96"></div>
      </main>
      <script>
        const roomName = "${room}";
        const token = "${token}";
        let currentFacingMode = 'environment';
        let localTrack;
        let roomInstance;

        async function startVideo(facingMode) {
          const videoTrack = await Twilio.Video.createLocalVideoTrack({ facingMode });
          localTrack = videoTrack;
          return videoTrack;
        }

        async function connectToRoom() {
          const track = await startVideo(currentFacingMode);

          Twilio.Video.connect(token, {
            name: roomName,
            audio: true,
            tracks: [track]
          }).then(room => {
            roomInstance = room;
            document.getElementById("video-container").appendChild(track.attach());

            room.on('participantConnected', participant => {
              participant.on('trackSubscribed', track => {
                document.getElementById("video-container").appendChild(track.attach());
              });
            });
          }).catch(error => {
            console.error("Connection failed:", error);
            alert("❌ Failed to join support session.");
          });
        }

        document.getElementById("switchCamera").addEventListener("click", async () => {
          try {
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

            const oldTrack = localTrack;
            const attachedElement = oldTrack.detach()[0];
            attachedElement?.remove();
            oldTrack.stop();

            roomInstance.localParticipant.unpublishTrack(oldTrack);

            await new Promise(resolve => setTimeout(resolve, 500));

            const newTrack = await Twilio.Video.createLocalVideoTrack({ facingMode: currentFacingMode });

            roomInstance.localParticipant.publishTrack(newTrack);
            document.getElementById("video-container").appendChild(newTrack.attach());

            localTrack = newTrack;
          } catch (error) {
            console.error("Camera switch failed:", error);
            alert("⚠️ Failed to switch camera. Please allow camera access and try again.");
          }
        });

        connectToRoom();
      </script>
    </body>
    </html>
  `);
});

app.get('/', (req, res) => {
  res.redirect('/agent.html');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});