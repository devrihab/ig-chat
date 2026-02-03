const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const usernameInput = document.getElementById('username-input');
const roomInput = document.getElementById('room-input');
const saveButton = document.getElementById('save-profile');
const roomLabel = document.getElementById('room-label');
const statusEl = document.getElementById('status');
const chatScreen = document.getElementById('chat-screen');
const landing = document.getElementById('landing');

const socket = io();
let currentRoom = '';

function getProfile() {
  const stored = localStorage.getItem('ig-chat-profile');
  if (!stored) return { username: '', room: currentRoom };
  try {
    const parsed = JSON.parse(stored);
    return {
      username: parsed.username || '',
      room: currentRoom,
    };
  } catch (err) {
    return { username: '', room: currentRoom };
  }
}

function setProfile(profile) {
  currentRoom = profile.room || '';
  localStorage.setItem('ig-chat-profile', JSON.stringify({ username: profile.username || '' }));
}

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

const profile = getProfile();
usernameInput.value = profile.username;
roomInput.value = '';
updateRoomLabel('');

saveButton.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const room = roomInput.value.trim();

  if (!username) {
    setStatus('Please add your name so your messages show up.');
    return;
  }

  if (!room) {
    setStatus('Please enter a room code.');
    return;
  }

  const updated = { username, room };
  setProfile(updated);
  updateRoomLabel(room);
  loadMessages(updated);
  chatScreen.classList.remove('hidden');
  landing.classList.add('hidden');
  setStatus('Saved. You are ready to chat.');
});

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const content = messageInput.value.trim();
  const current = getProfile();

  if (!current.username) {
    setStatus('Add your name first.');
    return;
  }

  if (!current.room) {
    setStatus('Enter a room code first.');
    return;
  }

  if (!content) return;

  socket.emit('chat:message', {
    username: current.username,
    room: current.room,
    content,
  });

  messageInput.value = '';
});

socket.on('chat:new', (message) => {
  renderMessage(message, getProfile());
});
