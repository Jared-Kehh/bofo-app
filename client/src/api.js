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

// ── Employees ─────────────────────────────────────────────────────────────

export async function getEmployees() {
  const res = await fetch(`${BASE}/api/employees`);
  if (!res.ok) throw new Error('Failed to fetch employees');
  return res.json();
}
export async function addEmployee(name) {
  const res = await fetch(`${BASE}/api/employees`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to add employee');
  return res.json();
}
export async function deleteEmployee(id) {
  const res = await fetch(`${BASE}/api/employees/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete employee');
}

// ── Brands ────────────────────────────────────────────────────────────────

export async function getBrands() {
  const res = await fetch(`${BASE}/api/brands`);
  if (!res.ok) throw new Error('Failed to fetch brands');
  return res.json();
}
export async function addBrand(name) {
  const res = await fetch(`${BASE}/api/brands`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to add brand');
  return res.json();
}
export async function deleteBrand(id) {
  const res = await fetch(`${BASE}/api/brands/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete brand');
}

// ── Work Types ────────────────────────────────────────────────────────────

export async function getWorkTypes() {
  const res = await fetch(`${BASE}/api/work-types`);
  if (!res.ok) throw new Error('Failed to fetch work types');
  return res.json();
}
export async function addWorkType(name) {
  const res = await fetch(`${BASE}/api/work-types`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to add work type');
  return res.json();
}
export async function deleteWorkType(id) {
  const res = await fetch(`${BASE}/api/work-types/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete work type');
}

// ── Products ──────────────────────────────────────────────────────────────

export async function getProducts() {
  const res = await fetch(`${BASE}/api/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}
export async function addProduct(brand, workType, name) {
  const res = await fetch(`${BASE}/api/products`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brand, workType, name }),
  });
  if (!res.ok) throw new Error('Failed to add product');
  return res.json();
}
export async function deleteProduct(id) {
  const res = await fetch(`${BASE}/api/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete product');
}

// ── Tools ─────────────────────────────────────────────────────────────────

export async function getTools() {
  const res = await fetch(`${BASE}/api/tools`);
  if (!res.ok) throw new Error('Failed to fetch tools');
  return res.json();
}
export async function addTool(name) {
  const res = await fetch(`${BASE}/api/tools`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to add tool');
  return res.json();
}
export async function deleteTool(id) {
  const res = await fetch(`${BASE}/api/tools/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete tool');
}

// ── Units ─────────────────────────────────────────────────────────────────

export async function getUnits() {
  const res = await fetch(`${BASE}/api/units`);
  if (!res.ok) throw new Error('Failed to fetch units');
  return res.json();
}
export async function addUnit(name) {
  const res = await fetch(`${BASE}/api/units`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to add unit');
  return res.json();
}
export async function deleteUnit(id) {
  const res = await fetch(`${BASE}/api/units/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete unit');
}
