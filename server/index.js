require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
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
    if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

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

// DELETE a submission
app.delete('/api/submissions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error('DELETE error:', err.message);
    res.status(500).json({ error: 'Failed to delete submission' });
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

// POST upload a single report photo to Supabase Storage
app.post('/api/reports/photos', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const ext = path.extname(req.file.originalname) || '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

  try {
    const { error } = await supabase.storage
      .from('report-photos')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('report-photos')
      .getPublicUrl(filename);

    res.json({ url: urlData.publicUrl });
  } catch (err) {
    console.error('Photo upload error:', err.message);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// GET all daily reports - newest first
app.get('/api/reports', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;
    res.json(data.map(mapReport));
  } catch (err) {
    console.error('GET reports error:', err.message);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST create a new daily report
app.post('/api/reports', async (req, res) => {
  const { employeeName, jobSite, notes, photoUrls } = req.body;

  if (!employeeName || !jobSite) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const now = new Date();
    const { data, error } = await supabase
      .from('daily_reports')
      .insert([{
        employee_name: employeeName,
        job_site: jobSite,
        notes: notes || '',
        photo_urls: photoUrls || [],
        timestamp: now.toISOString(),
        date: now.toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(mapReport(data));
  } catch (err) {
    console.error('POST report error:', err.message);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// DELETE a daily report
app.delete('/api/reports/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('daily_reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error('DELETE report error:', err.message);
    res.status(500).json({ error: 'Failed to delete report' });
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

function mapReport(row) {
  return {
    id: row.id,
    employeeName: row.employee_name,
    jobSite: row.job_site,
    notes: row.notes,
    photoUrls: row.photo_urls || [],
    timestamp: row.timestamp,
    date: row.date
  };
}

// POST seed base locations (only inserts names that don't already exist)
app.post('/api/locations/seed', async (req, res) => {
  const { names } = req.body;
  if (!Array.isArray(names) || !names.length) {
    return res.status(400).json({ error: 'names array required' });
  }
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('job_sites')
      .select('name');
    if (fetchErr) throw fetchErr;

    const existingNames = new Set(existing.map(r => r.name));
    const toInsert = names.filter(n => !existingNames.has(n)).map(name => ({ name }));

    if (!toInsert.length) return res.json([]);

    const { data, error } = await supabase
      .from('job_sites')
      .insert(toInsert)
      .select();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('SEED locations error:', err.message);
    res.status(500).json({ error: 'Failed to seed locations' });
  }
});

// GET all custom locations
app.get('/api/locations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('job_sites')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('GET locations error:', err.message);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// POST add a custom location
app.post('/api/locations', async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
  try {
    const { data, error } = await supabase
      .from('job_sites')
      .insert([{ name: name.trim() }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('POST location error:', err.message);
    res.status(500).json({ error: 'Failed to add location' });
  }
});

// DELETE a custom location
app.delete('/api/locations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('job_sites')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error('DELETE location error:', err.message);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

app.listen(PORT, () => {
  console.log(`Bofo server running on http://localhost:${PORT}`);
});
