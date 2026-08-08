import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  initChat();
  initCalendar();
  initOrbAnimation();

  // Form submission prevent default
  document.getElementById('contact-form').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Synchronization requested!');
  });
});

let currentSessionId = null;

function appendMessage(type, text) {
  const chatHistory = document.getElementById('chat-history');
  const div = document.createElement('div');
  div.className = `chat-bubble chat-${type}`;
  div.innerText = text;
  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function renderFeedback(feedback) {
  const chatHistory = document.getElementById('chat-history');
  const div = document.createElement('div');
  div.className = 'feedback-container';
  
  const strengthsHtml = feedback.strengths.map(s => `<li>${s}</li>`).join('');
  const gapsHtml = feedback.gaps.map(g => `<li>${g}</li>`).join('');
  const nextHtml = feedback.next.map(n => `<li>${n}</li>`).join('');

  div.innerHTML = `
    <h3>Interview Summary</h3>
    <p>${feedback.summary}</p>
    <br/>
    <h3>Strengths</h3>
    <ul>${strengthsHtml}</ul>
    <h3>Areas for Improvement</h3>
    <ul>${gapsHtml}</ul>
    <h3>Next Steps</h3>
    <ul>${nextHtml}</ul>
  `;
  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function startInterview() {
  currentSessionId = 'session-' + Math.random().toString(36).substr(2, 9);
  
  try {
    const res = await fetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: currentSessionId,
        candidate: { name: 'Alex' }
      })
    });
    
    const data = await res.json();
    appendMessage('ai', data.reply);
    
    document.getElementById('chat-input').disabled = false;
    document.getElementById('chat-send').disabled = false;
  } catch (err) {
    console.error('Error starting interview:', err);
    appendMessage('ai', 'Error connecting to the interview server.');
  }
}

async function sendChatMessage() {
  const inputEl = document.getElementById('chat-input');
  const text = inputEl.value.trim();
  if (!text || !currentSessionId) return;

  appendMessage('user', text);
  inputEl.value = '';
  inputEl.disabled = true;
  document.getElementById('chat-send').disabled = true;

  try {
    const res = await fetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: currentSessionId,
        message: text
      })
    });
    
    const data = await res.json();
    appendMessage('ai', data.reply);
    
    if (data.done && data.feedback) {
      renderFeedback(data.feedback);
    } else {
      inputEl.disabled = false;
      document.getElementById('chat-send').disabled = false;
      inputEl.focus();
    }
  } catch (err) {
    console.error('Error sending message:', err);
    appendMessage('ai', 'Error communicating with server.');
  }
}

function initChat() {
  document.getElementById('chat-send').addEventListener('click', sendChatMessage);
  document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });
}

function initCalendar() {
  const calendarWidget = document.getElementById('calendar-widget');
  const events = [
    { time: '10:00 AM', title: 'Technical Screening', active: false },
    { time: '02:30 PM', title: 'Behavioral Interview', active: true },
    { time: 'Tomorrow', title: 'System Design Round', active: false }
  ];

  events.forEach(evt => {
    const item = document.createElement('div');
    item.className = `calendar-item ${evt.active ? 'active' : ''}`;
    
    item.innerHTML = `
      <div>
        <div class="cal-time">${evt.time}</div>
        <div class="cal-title">${evt.title}</div>
      </div>
      <div class="cal-status ${evt.active ? 'glowing' : ''}"></div>
    `;
    calendarWidget.appendChild(item);
  });
}

function initOrbAnimation() {
  const canvas = document.getElementById('ai-orb');
  const ctx = canvas.getContext('2d');
  const btn = document.getElementById('start-btn');
  
  // Set canvas resolution
  const width = 300;
  const height = 300;
  canvas.width = width;
  canvas.height = height;

  let time = 0;
  let isSpeaking = false;

  btn.addEventListener('click', () => {
    if (!isSpeaking && !currentSessionId) {
      startInterview();
    }
    isSpeaking = true;
    btn.innerText = 'Interview in Progress...';
    btn.disabled = true;
  });

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 100;

    // Draw audio waveform / sphere effect
    ctx.beginPath();
    for (let i = 0; i < Math.PI * 2; i += 0.1) {
      // Create some noise/variation based on time and angle
      const noise = Math.sin(i * 5 + time) * Math.cos(i * 3 - time * 0.5);
      const intensity = isSpeaking ? 30 : 5; // Amplitude of the waveform
      
      const r = radius + noise * intensity;
      const x = centerX + Math.cos(i) * r;
      const y = centerY + Math.sin(i) * r;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    
    // Style the waveform
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00f3ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f3ff';
    ctx.stroke();

    // Inner core
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 243, 255, 0.1)';
    ctx.fill();

    time += 0.05;
    requestAnimationFrame(draw);
  }

  draw();
}
