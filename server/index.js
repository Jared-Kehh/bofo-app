const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, 'submissions.json');

app.use(cors());
app.use(express.json());

// Initialize submissions file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

function readSubmissions() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeSubmissions(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET all submissions
app.get('/api/submissions', (req, res) => {
  const submissions = readSubmissions();
  res.json(submissions);
});

// POST a new submission
app.post('/api/submissions', (req, res) => {
  const { employeeName, jobSite, requestType, details, quantity, notes } = req.body;

  if (!employeeName || !jobSite || !requestType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const submissions = readSubmissions();

  const newSubmission = {
    id: Date.now().toString(),
    employeeName,
    jobSite,
    requestType,
    details: details || {},
    quantity: quantity || null,
    notes: notes || '',
    status: 'Pending',
    timestamp: new Date().toISOString()
  };

  submissions.unshift(newSubmission);
  writeSubmissions(submissions);

  res.status(201).json(newSubmission);
});

// PATCH update submission status
app.patch('/api/submissions/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const submissions = readSubmissions();
  const idx = submissions.findIndex(s => s.id === id);

  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  submissions[idx].status = status;
  writeSubmissions(submissions);
  res.json(submissions[idx]);
});

app.listen(PORT, () => {
  console.log(`Bofo server running on http://localhost:${PORT}`);
});
