const usernameInput = document.getElementById('username-input');
const roomInput = document.getElementById('room-input');
const startButton = document.getElementById('start-chat');
const statusEl = document.getElementById('status');

function setStatus(text) {
  statusEl.textContent = text;
}

const savedName = localStorage.getItem('ig-chat-username');
if (savedName) {
  usernameInput.value = savedName;
}

startButton.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const room = roomInput.value.trim();

  if (!username) {
    setStatus('Please enter your name.');
    return;
  }

  if (!room) {
    setStatus('Please enter a room code.');
    return;
  }

  localStorage.setItem('ig-chat-username', username);
  sessionStorage.setItem('ig-chat-session', JSON.stringify({ username, room }));
  window.location.href = '/';
});
