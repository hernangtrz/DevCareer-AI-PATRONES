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

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

async function testModel(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with JSON: {"message": "hello"}' }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });
    console.log(`[${model}] Status:`, res.status);
    const text = await res.text();
    console.log(`[${model}] Response:`, text.slice(0, 150));
  } catch (err) {
    console.error(`[${model}] Fetch error:`, err.message);
  }
}

async function run() {
  await testModel('gemini-3.6-flash');
  await testModel('gemini-3.5-flash-lite');
  await testModel('gemini-3.7-flash');
}

run().catch(console.error);
