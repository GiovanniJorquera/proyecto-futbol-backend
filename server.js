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

if (!process.env.MONGODB_URI) {
  console.error('❌ Falta MONGODB_URI en las variables de entorno');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ Falta JWT_SECRET en las variables de entorno');
  process.exit(1);
}

if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) {
  console.error('❌ Falta ADMIN_USER o ADMIN_PASSWORD en las variables de entorno');
  process.exit(1);
}

async function getConfig() {
  let config = await SiteConfig.findOne();
  if (!config) config = await SiteConfig.create({});
  return config;
}

const app = express();
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '20mb' }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('🟢 Conectado a MongoDB'))
  .catch((err) => console.error('🔴 Error MongoDB:', err));

const InscripcionSchema = new mongoose.Schema({
  apoderado: {
    nombre: String,
    apellidos: String,
    correo: String,
    telefono: String,
  },
  pupilo: {
    nombre: String,
    apellidoPaterno: String,
    apellidoMaterno: String,
    rut: String,
    fechaNacimiento: String,
    genero: Object,
    direccion: String,
    comuna: Object,
  },
  estado: {
    type: String,
    default: 'pendiente',
  },
  fechaRegistro: {
    type: Date,
    default: Date.now,
  },
});

const Inscripcion = mongoose.model('Inscripcion', InscripcionSchema);

/* LOGIN */
app.post('/login', (req, res) => {
  const { user, password } = req.body;

  if (user !== process.env.ADMIN_USER || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
  }

  const token = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

/* MIDDLEWARE: verificar token */
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ mensaje: 'Token requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ mensaje: 'Token inválido o expirado' });
    }
    req.user = decoded;
    next();
  });
}

/* RUTAS PÚBLICAS */
app.get('/', (req, res) => {
  res.send('Servidor funcionando');
});

app.get('/noticias', async (req, res) => {
  try {
    const noticias = await Noticia.find().sort({ createdAt: -1 });
    res.json(noticias);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener noticias' });
  }
});

app.get('/config', async (req, res) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener configuración' });
  }
});

/* Planteles público (profesores sin auth para página de inicio) */
app.get('/planteles', async (req, res) => {
  try {
    const data = await Profesor.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener planteles' });
  }
});

/* Partidos (GET público, resto protegido) */
app.get('/partidos', async (req, res) => {
  try {
    const data = await Partido.find().sort({ fecha: 1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener partidos' });
  }
});
app.post('/partidos', verificarToken, async (req, res) => {
  try { res.status(201).json(await new Partido(req.body).save()); }
  catch (e) { res.status(500).json({ mensaje: 'Error al crear partido' }); }
});
app.put('/partidos/:id', verificarToken, async (req, res) => {
  try {
    const doc = await Partido.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ mensaje: 'No encontrado' });
    res.json(doc);
  } catch (e) { res.status(500).json({ mensaje: 'Error al actualizar partido' }); }
});
app.delete('/partidos/:id', verificarToken, async (req, res) => {
  try { await Partido.findByIdAndDelete(req.params.id); res.json({ mensaje: 'Eliminado' }); }
  catch (e) { res.status(500).json({ mensaje: 'Error al eliminar partido' }); }
});

app.post('/inscripcion', async (req, res) => {
  try {
    const nueva = new Inscripcion(req.body);
    await nueva.save();
    console.log('💾 Guardado en MongoDB');
    res.json({ mensaje: 'Guardado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al guardar' });
  }
});

app.post('/pagos', async (req, res) => {
  try {
    const nuevoPago = new Pago(req.body);
    const guardado = await nuevoPago.save();
    res.status(201).json(guardado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al guardar el pago' });
  }
});

/* RUTAS PROTEGIDAS (requieren token) */

function crudRoutes(app, path, Model) {
  app.get(path, verificarToken, async (req, res) => {
    try { res.json(await Model.find().sort({ createdAt: -1 })); }
    catch (e) { res.status(500).json({ mensaje: 'Error al obtener datos' }); }
  });
  app.post(path, verificarToken, async (req, res) => {
    try { res.status(201).json(await new Model(req.body).save()); }
    catch (e) { res.status(500).json({ mensaje: 'Error al crear' }); }
  });
  app.put(`${path}/:id`, verificarToken, async (req, res) => {
    try {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!doc) return res.status(404).json({ mensaje: 'No encontrado' });
      res.json(doc);
    } catch (e) { res.status(500).json({ mensaje: 'Error al actualizar' }); }
  });
  app.delete(`${path}/:id`, verificarToken, async (req, res) => {
    try { await Model.findByIdAndDelete(req.params.id); res.json({ mensaje: 'Eliminado' }); }
    catch (e) { res.status(500).json({ mensaje: 'Error al eliminar' }); }
  });
}

crudRoutes(app, '/estudiantes', Estudiante);
crudRoutes(app, '/profesores', Profesor);
crudRoutes(app, '/divisiones', Division);

app.post('/noticias', verificarToken, async (req, res) => {
  try {
    const noticia = new Noticia(req.body);
    await noticia.save();
    res.status(201).json(noticia);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear noticia' });
  }
});

app.put('/noticias/:id', verificarToken, async (req, res) => {
  try {
    const noticia = await Noticia.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!noticia) return res.status(404).json({ mensaje: 'Noticia no encontrada' });
    res.json(noticia);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar noticia' });
  }
});

app.delete('/noticias/:id', verificarToken, async (req, res) => {
  try {
    await Noticia.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Noticia eliminada' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar noticia' });
  }
});

app.put('/config', verificarToken, async (req, res) => {
  try {
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create(req.body);
    } else {
      config = await SiteConfig.findByIdAndUpdate(
        config._id,
        { $set: req.body },
        { new: true, runValidators: false }
      );
    }
    res.json(config);
  } catch (error) {
    console.error('Error al guardar config:', error.message);
    res.status(500).json({ mensaje: 'Error al guardar configuración', detalle: error.message });
  }
});
app.get('/pagos', verificarToken, async (req, res) => {
  try {
    const filtro = {};
    if (req.query.estado) filtro.estado = req.query.estado;
    const pagos = await Pago.find(filtro).select('-voucherBase64').sort({ fechaRegistro: -1 });
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener pagos' });
  }
});

app.get('/pagos/:id', verificarToken, async (req, res) => {
  try {
    const pago = await Pago.findById(req.params.id);
    if (!pago) return res.status(404).json({ mensaje: 'Pago no encontrado' });
    res.json(pago);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener pago' });
  }
});

app.patch('/pagos/:id/estado', verificarToken, async (req, res) => {
  try {
    const { estado } = req.body;

    if (!['pendiente', 'aprobado', 'rechazado'].includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado invalido' });
    }

    const pagoActualizado = await Pago.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    );

    if (!pagoActualizado) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }

    res.json(pagoActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar el pago' });
  }
});

app.get('/inscripciones', verificarToken, async (req, res) => {
  try {
    const data = await Inscripcion.find().sort({ fechaRegistro: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener datos' });
  }
});

app.put('/aprobar/:id', verificarToken, async (req, res) => {
  try {
    await Inscripcion.findByIdAndUpdate(req.params.id, { estado: 'aprobado' });
    res.json({ mensaje: 'Aprobado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al aprobar' });
  }
});

app.put('/rechazar/:id', verificarToken, async (req, res) => {
  try {
    await Inscripcion.findByIdAndUpdate(req.params.id, { estado: 'rechazado' });
    res.json({ mensaje: 'Rechazado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al rechazar' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});