import express from 'express';
import cors from 'cors';
import { listScenes, getScene, saveScene, deleteScene } from './store.js';
import { Scene, SavedObject } from './types.js';

const app = express();
const PORT = process.env.PORT ?? 8000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// ── Scenes ────────────────────────────────────────────────────────────────────

// GET /api/scenes — list all saved scenes
app.get('/api/scenes', (_req, res) => {
  res.json(listScenes());
});

// GET /api/scenes/:id — get a single scene
app.get('/api/scenes/:id', (req, res) => {
  const scene = getScene(req.params.id);
  if (!scene) return res.status(404).json({ error: 'Scene not found' });
  return res.json(scene);
});

// POST /api/scenes — create or overwrite a scene
app.post('/api/scenes', (req, res) => {
  const body = req.body as Partial<Scene>;

  if (!body.name || !Array.isArray(body.objects)) {
    return res.status(400).json({ error: 'name and objects are required' });
  }

  const now = new Date().toISOString();
  const scene: Scene = {
    id: body.id ?? `scene_${Date.now()}`,
    name: body.name,
    createdAt: body.createdAt ?? now,
    updatedAt: now,
    objects: body.objects as SavedObject[],
  };

  return res.status(201).json(saveScene(scene));
});

// PUT /api/scenes/:id — update an existing scene
app.put('/api/scenes/:id', (req, res) => {
  const existing = getScene(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Scene not found' });

  const body = req.body as Partial<Scene>;
  const updated: Scene = {
    ...existing,
    name: body.name ?? existing.name,
    objects: Array.isArray(body.objects) ? (body.objects as SavedObject[]) : existing.objects,
    updatedAt: new Date().toISOString(),
  };

  return res.json(saveScene(updated));
});

// DELETE /api/scenes/:id — remove a scene
app.delete('/api/scenes/:id', (req, res) => {
  if (!deleteScene(req.params.id)) {
    return res.status(404).json({ error: 'Scene not found' });
  }
  return res.status(204).send();
});

// ── Matrix utilities ───────────────────────────────────────────────────────────

// POST /api/matrix/multiply — multiply two 4×4 matrices (row-major arrays of 16 numbers)
app.post('/api/matrix/multiply', (req, res) => {
  const { a, b } = req.body as { a: number[]; b: number[] };
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== 16 || b.length !== 16) {
    return res.status(400).json({ error: 'a and b must each be arrays of 16 numbers' });
  }

  const result = new Array<number>(16).fill(0);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      for (let k = 0; k < 4; k++) {
        result[row * 4 + col] += a[row * 4 + k] * b[k * 4 + col];
      }
    }
  }
  return res.json({ result });
});

// POST /api/matrix/invert — invert a 4×4 matrix (row-major)
app.post('/api/matrix/invert', (req, res) => {
  const { matrix } = req.body as { matrix: number[] };
  if (!Array.isArray(matrix) || matrix.length !== 16) {
    return res.status(400).json({ error: 'matrix must be an array of 16 numbers' });
  }

  const m = matrix;
  const inv = new Array<number>(16).fill(0);

  inv[0]  =  m[5]*m[10]*m[15] - m[5]*m[11]*m[14] - m[9]*m[6]*m[15] + m[9]*m[7]*m[14] + m[13]*m[6]*m[11] - m[13]*m[7]*m[10];
  inv[4]  = -m[4]*m[10]*m[15] + m[4]*m[11]*m[14] + m[8]*m[6]*m[15] - m[8]*m[7]*m[14] - m[12]*m[6]*m[11] + m[12]*m[7]*m[10];
  inv[8]  =  m[4]*m[9] *m[15] - m[4]*m[11]*m[13] - m[8]*m[5]*m[15] + m[8]*m[7]*m[13] + m[12]*m[5]*m[11] - m[12]*m[7]*m[9];
  inv[12] = -m[4]*m[9] *m[14] + m[4]*m[10]*m[13] + m[8]*m[5]*m[14] - m[8]*m[6]*m[13] - m[12]*m[5]*m[10] + m[12]*m[6]*m[9];
  inv[1]  = -m[1]*m[10]*m[15] + m[1]*m[11]*m[14] + m[9]*m[2]*m[15] - m[9]*m[3]*m[14] - m[13]*m[2]*m[11] + m[13]*m[3]*m[10];
  inv[5]  =  m[0]*m[10]*m[15] - m[0]*m[11]*m[14] - m[8]*m[2]*m[15] + m[8]*m[3]*m[14] + m[12]*m[2]*m[11] - m[12]*m[3]*m[10];
  inv[9]  = -m[0]*m[9] *m[15] + m[0]*m[11]*m[13] + m[8]*m[1]*m[15] - m[8]*m[3]*m[13] - m[12]*m[1]*m[11] + m[12]*m[3]*m[9];
  inv[13] =  m[0]*m[9] *m[14] - m[0]*m[10]*m[13] - m[8]*m[1]*m[14] + m[8]*m[2]*m[13] + m[12]*m[1]*m[10] - m[12]*m[2]*m[9];
  inv[2]  =  m[1]*m[6] *m[15] - m[1]*m[7] *m[14] - m[5]*m[2]*m[15] + m[5]*m[3]*m[14] + m[13]*m[2]*m[7]  - m[13]*m[3]*m[6];
  inv[6]  = -m[0]*m[6] *m[15] + m[0]*m[7] *m[14] + m[4]*m[2]*m[15] - m[4]*m[3]*m[14] - m[12]*m[2]*m[7]  + m[12]*m[3]*m[6];
  inv[10] =  m[0]*m[5] *m[15] - m[0]*m[7] *m[13] - m[4]*m[1]*m[15] + m[4]*m[3]*m[13] + m[12]*m[1]*m[7]  - m[12]*m[3]*m[5];
  inv[14] = -m[0]*m[5] *m[14] + m[0]*m[6] *m[13] + m[4]*m[1]*m[14] - m[4]*m[2]*m[13] - m[12]*m[1]*m[6]  + m[12]*m[2]*m[5];
  inv[3]  = -m[1]*m[6] *m[11] + m[1]*m[7] *m[10] + m[5]*m[2]*m[11] - m[5]*m[3]*m[10] - m[9] *m[2]*m[7]  + m[9] *m[3]*m[6];
  inv[7]  =  m[0]*m[6] *m[11] - m[0]*m[7] *m[10] - m[4]*m[2]*m[11] + m[4]*m[3]*m[10] + m[8] *m[2]*m[7]  - m[8] *m[3]*m[6];
  inv[11] = -m[0]*m[5] *m[11] + m[0]*m[7] *m[9]  + m[4]*m[1]*m[11] - m[4]*m[3]*m[9]  - m[8] *m[1]*m[7]  + m[8] *m[3]*m[5];
  inv[15] =  m[0]*m[5] *m[10] - m[0]*m[6] *m[9]  - m[4]*m[1]*m[10] + m[4]*m[2]*m[9]  + m[8] *m[1]*m[6]  - m[8] *m[2]*m[5];

  const det = m[0]*inv[0] + m[1]*inv[4] + m[2]*inv[8] + m[3]*inv[12];
  if (det === 0) return res.status(400).json({ error: 'Matrix is not invertible' });

  const invDet = 1 / det;
  return res.json({ result: inv.map(v => v * invDet) });
});

// ── Health check ───────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
