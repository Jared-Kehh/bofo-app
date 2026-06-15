const BASE = import.meta.env.VITE_API_URL || '';

export async function getSubmissions() {
  const res = await fetch(`${BASE}/api/submissions`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export async function createSubmission(data) {
  const res = await fetch(`${BASE}/api/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit');
  return res.json();
}

export async function deleteSubmission(id) {
  const res = await fetch(`${BASE}/api/submissions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete');
}

export async function updateStatus(id, status) {
  const res = await fetch(`${BASE}/api/submissions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update');
  return res.json();
}

export async function uploadReportPhoto(file, jobSite, employeeName) {
  const formData = new FormData();
  formData.append('photo', file);
  if (jobSite) formData.append('jobSite', jobSite);
  if (employeeName) formData.append('employeeName', employeeName);
  const res = await fetch(`${BASE}/api/reports/photos`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload photo');
  return res.json();
}

export async function createReport(data) {
  const res = await fetch(`${BASE}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit report');
  return res.json();
}

export async function getReports() {
  const res = await fetch(`${BASE}/api/reports`);
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}

export async function deleteReport(id) {
  const res = await fetch(`${BASE}/api/reports/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete report');
}

export async function getLocations() {
  const res = await fetch(`${BASE}/api/locations`);
  if (!res.ok) throw new Error('Failed to fetch locations');
  return res.json();
}

export async function addLocation(name) {
  const res = await fetch(`${BASE}/api/locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to add location');
  return res.json();
}

export async function deleteLocation(id) {
  const res = await fetch(`${BASE}/api/locations/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete location');
}

export async function seedLocations(names) {
  const res = await fetch(`${BASE}/api/locations/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ names })
  });
  if (!res.ok) throw new Error('Failed to seed locations');
  return res.json();
}
