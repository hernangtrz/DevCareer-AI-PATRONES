const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../Backend/.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      process.env[k] = v;
    }
  });
}

const {
  GeminiAdapter,
  InterviewEvaluationService,
  EnglishProficiencyService,
} = require('../Backend/dist/services/ai');

async function testFeedback() {
  const adapter = new GeminiAdapter('gemini-3.5-flash-lite');
  const interviewEval = new InterviewEvaluationService(adapter);
  const englishEval = new EnglishProficiencyService(adapter);

  const englishTranscript = `
- assistant: Welcome to the Full Stack Developer interview. Could you explain the difference between state and props in React?
- user: Well, props are passed from parent to child component and they are immutable. On the other hand, state is managed internally within the component and can change over time through setState or useState hook.
- assistant: Great explanation. How do you handle asynchronous operations in Node.js?
- user: In Node.js, I usually use async/await with try/catch blocks because it makes the code much cleaner and readable than traditional promises or callbacks.
  `;

  console.log('Testing Interview Evaluation...');
  const feedback = await interviewEval.evaluate(englishTranscript, true);
  console.log('Interview Feedback Result:', JSON.stringify(feedback, null, 2));

  console.log('\nTesting English Proficiency Evaluation...');
  const english = await englishEval.evaluate(englishTranscript);
  console.log('English Proficiency Result:', JSON.stringify(english, null, 2));
}

testFeedback().catch(console.error);
