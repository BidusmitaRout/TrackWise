# Minimal backend for Learning Tracker

Quick scaffold: a tiny Node/Express server providing CRUD for a single resource at `/api/items` using a local `db.json` file.

Run:

```bash
cd backend
npm install
# during development
npm run dev
# or to start
npm start
```

API endpoints:

- `GET /api/items` — list items
- `GET /api/items/:id` — get one
- `POST /api/items` — create (JSON body)
- `PUT /api/items/:id` — update (JSON body)
- `DELETE /api/items/:id` — delete

User-scoped behavior

- The backend supports scoping items to a user via an `owner` field on each item.
- When listing items include the query param `?user=<email>` to return only that user's items.
- When creating/updating items include an `owner` property in the JSON body (frontend should set this to the authenticated user's email).
- Delete operations may include `?user=<email>` to ensure the user owns the item being deleted.

This makes it straightforward to keep different users' trackers separate. The current frontend sends the logged-in user's email when calling the API; unauthenticated clients still use `localStorage` as a fallback.

Frontend integration example (call from your existing pages):

```js
const API_BASE = 'http://localhost:3000/api';

async function listItems(){
  const res = await fetch(`${API_BASE}/items`);
  return res.json();
}

async function createItem(payload){
  const res = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function updateItem(id, payload){
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function deleteItem(id){
  const res = await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' });
  return res.json();
}

// Example usage from your frontend:
// listItems().then(render);
// createItem({ title: 'New', description: '...' })
```

Notes:
- This uses file-based storage (`db.json`) — fine for local/dev use only.
- For production or multi-user usage, replace with a real DB (SQLite, Postgres, etc.).
