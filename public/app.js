const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const roomLabel = document.getElementById('room-label');
const statusEl = document.getElementById('status');
const backButton = document.getElementById('back-button');

const socket = io();
let currentUser = null;

function renderMessage(message, currentUser) {
  if (message.room !== currentUser.room) return;

  const bubble = document.createElement('div');
  bubble.className = `message ${message.username === currentUser.username ? 'me' : 'them'}`;
  bubble.textContent = message.content;

  const meta = document.createElement('span');
  meta.className = 'meta';
  const createdAt = message.createdAt || message.created_at;
  const time = createdAt
    ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  meta.textContent = `${message.username} · ${time}`;

  bubble.appendChild(meta);
  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function loadMessages(profile) {
  const res = await fetch('/api/messages');
  const data = await res.json();
  chatBox.innerHTML = '';
  data.forEach((msg) => renderMessage({
    ...msg,
    createdAt: msg.created_at || msg.createdAt,
  }, profile));
}

function updateRoomLabel(room) {
  roomLabel.textContent = room ? `Room: ${room}` : 'Room: —';
}

function setStatus(text) {
  statusEl.textContent = text;
  if (text) {
    setTimeout(() => {
      statusEl.textContent = '';
    }, 2400);
  }
}

const sessionRaw = sessionStorage.getItem('ig-chat-session');
if (!sessionRaw) {
  window.location.href = '/landing.html';
}

try {
  currentUser = sessionRaw ? JSON.parse(sessionRaw) : null;
} catch (err) {
  currentUser = null;
}

if (!currentUser || !currentUser.username || !currentUser.room) {
  window.location.href = '/landing.html';
}

updateRoomLabel(currentUser.room);
sessionStorage.removeItem('ig-chat-session');

backButton.addEventListener('click', () => {
  window.location.href = '/landing.html';
});

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const content = messageInput.value.trim();
  const current = currentUser;

  if (!content) return;

  socket.emit('chat:message', {
    username: current.username,
    room: current.room,
    content,
  });

  messageInput.value = '';
});

socket.on('chat:new', (message) => {
  renderMessage(message, currentUser);
});

loadMessages(currentUser);
