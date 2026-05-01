require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Pago = require('./models/Pago');
const Noticia = require('./models/Noticia');
const SiteConfig = require('./models/SiteConfig');
const Estudiante = require('./models/Estudiante');
const Profesor = require('./models/Profesor');
const Division = require('./models/Division');
const Partido = require('./models/Partido');

/* ================= VALIDACIONES ================= */
if (!process.env.MONGODB_URI) {
  console.error("❌ Falta MONGODB_URI en .env");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("❌ Falta JWT_SECRET en .env");
  process.exit(1);
}

/* ================= APP ================= */
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

/* ================= DB ================= */
mongoose.connect(process.env.MONGODB_URI)

.then(() => console.log('🟢 Conectado a MongoDB'))
.catch(err => console.error('🔴 Error MongoDB:', err));

/* ================= MODELO INSCRIPCION ================= */
const InscripcionSchema = new mongoose.Schema({
  apoderado: Object,
  pupilo: Object,
  estado: { type: String, default: 'pendiente' },
  fechaRegistro: { type: Date, default: Date.now }
});

const Inscripcion = mongoose.model('Inscripcion', InscripcionSchema);

/* ================= CONFIG ================= */
async function getConfig() {
  let config = await SiteConfig.findOne();
  if (!config) config = await SiteConfig.create({});
  return config;
}

/* ================= LOGIN ================= */
app.post('/login', (req, res) => {
  const { user, password } = req.body;

  if (user !== process.env.ADMIN_USER || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
  }

  const token = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

/* ================= MIDDLEWARE ================= */
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ mensaje: 'Token requerido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ mensaje: 'Token inválido' });
    req.user = decoded;
    next();
  });
}

/* ================= RUTAS ================= */
app.get('/', (req, res) => res.send('Servidor funcionando 🚀'));

app.get('/noticias', async (req, res) => {
  try { res.json(await Noticia.find().sort({ createdAt: -1 })); }
  catch { res.status(500).json({ mensaje: 'Error noticias' }); }
});

app.get('/config', async (req, res) => {
  try { res.json(await getConfig()); }
  catch { res.status(500).json({ mensaje: 'Error config' }); }
});

app.get('/planteles', async (req, res) => {
  try { res.json(await Profesor.find().sort({ createdAt: -1 })); }
  catch { res.status(500).json({ mensaje: 'Error planteles' }); }
});

app.get('/partidos', async (req, res) => {
  try { res.json(await Partido.find().sort({ fecha: 1 })); }
  catch { res.status(500).json({ mensaje: 'Error partidos' }); }
});

app.post('/partidos', verificarToken, async (req, res) => {
  try { res.status(201).json(await new Partido(req.body).save()); }
  catch { res.status(500).json({ mensaje: 'Error crear partido' }); }
});

/* ================= INSCRIPCION ================= */
app.post('/inscripcion', async (req, res) => {
  try {
    await new Inscripcion(req.body).save();
    res.json({ mensaje: 'Guardado correctamente' });
  } catch {
    res.status(500).json({ mensaje: 'Error al guardar' });
  }
});

/* ================= PAGOS ================= */
app.post('/pagos', async (req, res) => {
  try { res.status(201).json(await new Pago(req.body).save()); }
  catch { res.status(500).json({ mensaje: 'Error pago' }); }
});

/* ================= CRUD GENERICO ================= */
function crudRoutes(path, Model) {
  app.get(path, verificarToken, async (req, res) => {
    try { res.json(await Model.find()); }
    catch { res.status(500).json({ mensaje: 'Error GET' }); }
  });

  app.post(path, verificarToken, async (req, res) => {
    try { res.status(201).json(await new Model(req.body).save()); }
    catch { res.status(500).json({ mensaje: 'Error POST' }); }
  });

  app.put(`${path}/:id`, verificarToken, async (req, res) => {
    try {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!doc) return res.status(404).json({ mensaje: 'No encontrado' });
      res.json(doc);
    } catch {
      res.status(500).json({ mensaje: 'Error PUT' });
    }
  });

  app.delete(`${path}/:id`, verificarToken, async (req, res) => {
    try {
      await Model.findByIdAndDelete(req.params.id);
      res.json({ mensaje: 'Eliminado' });
    } catch {
      res.status(500).json({ mensaje: 'Error DELETE' });
    }
  });
}

crudRoutes('/estudiantes', Estudiante);
crudRoutes('/profesores', Profesor);
crudRoutes('/divisiones', Division);

/* ================= SERVER ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});