const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'messages.json');
const MAX_MESSAGES = 300;

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function readMessages() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

function writeMessages(messages) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2), 'utf8');
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/messages', (req, res) => {
  res.json(readMessages());
});

io.on('connection', (socket) => {
  socket.on('chat:message', (payload) => {
    if (!payload || typeof payload !== 'object') return;

    const username = String(payload.username || '').trim();
    const content = String(payload.content || '').trim();
    const room = String(payload.room || 'main').trim();

    if (!username || !content) return;
    if (content.length > 500) return;

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      username,
      content,
      room,
      createdAt: new Date().toISOString(),
    };

    const messages = readMessages();
    messages.push(message);

    if (messages.length > MAX_MESSAGES) {
      messages.splice(0, messages.length - MAX_MESSAGES);
    }

    writeMessages(messages);
    io.emit('chat:new', message);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
});
