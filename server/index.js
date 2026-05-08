require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 4000;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

// GET all submissions - newest first
app.get('/api/submissions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;
    res.json(data.map(mapRow));
  } catch (err) {
    console.error('GET error:', err.message);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// POST a new submission
app.post('/api/submissions', async (req, res) => {
  const { employeeName, jobSite, requestType, details, quantity, notes, neededBy, priority } = req.body;

  if (!employeeName || !jobSite || !requestType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      .from('submissions')
      .insert([{
        employee_name: employeeName,
        job_site: jobSite,
        request_type: requestType,
        details: details || {},
        quantity: quantity || null,
        needed_by: neededBy || null,
        priority: priority || 'normal',
        notes: notes || '',
        status: 'Pending',
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Return in camelCase format the frontend expects
    res.status(201).json(mapRow(data));
  } catch (err) {
    console.error('POST error:', err.message);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

// PATCH update submission status
app.patch('/api/submissions/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const { data, error } = await supabase
      .from('submissions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(mapRow(data));
  } catch (err) {
    console.error('PATCH error:', err.message);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// Map snake_case DB columns to camelCase for frontend
function mapRow(row) {
  return {
    id: row.id,
    employeeName: row.employee_name,
    jobSite: row.job_site,
    requestType: row.request_type,
    details: row.details,
    quantity: row.quantity,
    neededBy: row.needed_by,
    priority: row.priority,
    notes: row.notes,
    status: row.status,
    timestamp: row.timestamp
  };
}

app.listen(PORT, () => {
  console.log(`Bofo server running on http://localhost:${PORT}`);
});
