
const express = require("express");
const http = require("http");
const path = require("path");
const { WebSocketServer } = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

app.use(
  "/studio",
  express.static(path.join(__dirname, "../public/studio"))
);

app.use(
  "/phone",
  express.static(path.join(__dirname, "../phone"))
);

app.get("/", (req, res) => {
  res.redirect("/studio");
});

app.get("/api/status", (req, res) => {
  res.json({
    online: true,
    clients: wss.clients.size
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("New device connected");

  ws.send(JSON.stringify({
    type: "connected",
    message: "Stream Life connected"
  }));

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      const allowed = [
        "chat",
        "donation",
        "stream_status"
      ];

      if (!allowed.includes(data.type)) return;

      broadcast({
        ...data,
        timestamp: Date.now()
      });

    } catch (error) {
      console.log("Invalid message received");
    }
  });

  ws.on("close", () => {
    console.log("Device disconnected");
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Stream Life server running on port ${PORT}`);
});

