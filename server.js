const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/messages', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured.' });

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

io.on('connection', (socket) => {
  socket.on('chat:message', async (payload) => {
    if (!payload || typeof payload !== 'object') return;

    const username = String(payload.username || '').trim();
    const content = String(payload.content || '').trim();
    const room = String(payload.room || 'main').trim();

    if (!username || !content) return;
    if (content.length > 500) return;

    if (!supabase) return;

    const { data, error } = await supabase
      .from('messages')
      .insert([{ username, content, room }])
      .select('*')
      .single();

    if (error || !data) return;

    io.emit('chat:new', {
      id: data.id,
      username: data.username,
      content: data.content,
      room: data.room,
      createdAt: data.created_at,
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
});
