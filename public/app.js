const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const usernameInput = document.getElementById('username-input');
const roomInput = document.getElementById('room-input');
const saveButton = document.getElementById('save-profile');
const roomLabel = document.getElementById('room-label');
const statusEl = document.getElementById('status');

const socket = io();

function getProfile() {
  const stored = localStorage.getItem('ig-chat-profile');
  if (!stored) return { username: '', room: 'main' };
  try {
    const parsed = JSON.parse(stored);
    return {
      username: parsed.username || '',
      room: parsed.room || 'main',
    };
  } catch (err) {
    return { username: '', room: 'main' };
  }
}

function setProfile(profile) {
  localStorage.setItem('ig-chat-profile', JSON.stringify(profile));
}

function renderMessage(message, currentUser) {
  if (message.room !== currentUser.room) return;

  const bubble = document.createElement('div');
  bubble.className = `message ${message.username === currentUser.username ? 'me' : 'them'}`;
  bubble.textContent = message.content;

  const meta = document.createElement('span');
  meta.className = 'meta';
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  meta.textContent = `${message.username} · ${time}`;

  bubble.appendChild(meta);
  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function loadMessages(profile) {
  const res = await fetch('/api/messages');
  const data = await res.json();
  chatBox.innerHTML = '';
  data.forEach((msg) => renderMessage(msg, profile));
}

function updateRoomLabel(room) {
  roomLabel.textContent = `Room: ${room}`;
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
roomInput.value = profile.room;
updateRoomLabel(profile.room);

loadMessages(profile);

saveButton.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const room = roomInput.value.trim() || 'main';

  if (!username) {
    setStatus('Please add your name so your messages show up.');
    return;
  }

  const updated = { username, room };
  setProfile(updated);
  updateRoomLabel(room);
  loadMessages(updated);
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
