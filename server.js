import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// In-memory store for interview sessions
const sessions = new Map();

app.post('/api/interview', (req, res) => {
  const { sessionId, candidate, message } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  // 1. Start Interview
  if (candidate) {
    sessions.set(sessionId, {
      candidate,
      turn: 0,
      history: []
    });
    
    return res.json({
      reply: `Welcome ${candidate.name || 'to your interview'}. Let's begin by discussing your background. Can you walk me through your recent experience?`,
      done: false
    });
  }

  // Retrieve session
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // 2. Conversation Turn
  if (message) {
    session.history.push({ role: 'user', text: message });
    session.turn += 1;

    // Simulated LLM state machine
    if (session.turn === 1) {
      return res.json({
        reply: "That's very interesting. Can you describe a time when you had to overcome a significant technical challenge?",
        done: false
      });
    } else if (session.turn === 2) {
      return res.json({
        reply: "I see. How do you approach collaborating with cross-functional teams in those situations?",
        done: false
      });
    } else {
      // 3. End Interview
      return res.json({
        reply: "Interview completed. Thank you for your time today.",
        done: true,
        feedback: {
          summary: "The candidate communicated clearly and provided concrete examples of technical challenges and teamwork.",
          strengths: [
            "Clear communication",
            "Technical problem solving",
            "Cross-functional collaboration"
          ],
          gaps: [
            "Could provide more quantifiable metrics for success"
          ],
          next: [
            "Proceed to technical deep-dive round",
            "Discuss compensation expectations"
          ]
        }
      });
    }
  }

  res.status(400).json({ error: 'Invalid request' });
});

app.listen(port, () => {
  console.log(`AI Interview Agent backend listening at http://localhost:${port}`);
});
