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

export async function updateStatus(id, status) {
  const res = await fetch(`${BASE}/api/submissions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update');
  return res.json();
}
