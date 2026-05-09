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
const UsuarioSistema = require('./models/UsuarioSistema');
const bcrypt = require('bcrypt');
const Asistencia = require('./models/Asistencia');

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

const FichaTemporadaSchema = new mongoose.Schema({
  fechaIngreso: {
    type: Date,
    default: Date.now,
  },

  nombre: { type: String, required: true },
  direccion: String,
  ciudad: String,
  fechaNacimiento: String,
  cedula: String,

  edad: Number,
  categoria: String,

  establecimiento: String,
  curso: String,
  clubAmateur: String,
  talla: String,

  numerosFavoritos: [Number],

  nombreCamiseta: String,
  posicion: String,
  pieHabil: String,

  aniosJugando: Number,
  otrosDeportes: String,
  otrasEscuelas: String,

  actitudSocial: String,
  actitudAdversidad: String,

  apoderado: {
    nombre: String,
    direccion: String,
    ciudad: String,
    rut: String,
    correo: String,
    telefonoCasa: String,
    whatsapp: String,
    vinculo: String,
  },
});

const FichaTemporada = mongoose.model('FichaTemporada', FichaTemporadaSchema);

function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);

  let edad = hoy.getFullYear() - nacimiento.getFullYear();

  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return edad;
}

function obtenerCategoria(fechaNacimiento) {
  const edad = calcularEdad(fechaNacimiento);

  if (edad <= 6) return 'Sub-6';
  if (edad <= 8) return 'Sub-8';
  if (edad <= 10) return 'Sub-10';
  if (edad <= 12) return 'Sub-12';
  if (edad <= 14) return 'Sub-14';
  if (edad <= 16) return 'Sub-16';
  if (edad <= 18) return 'Sub-18';

  return 'Libre';
}
/*Creación automática de usuarios con datos registrados*/
function generarUsuario(nombre, apellido, dominio = 'nombredominio.cl') {
  const primerNombre = nombre.trim().toLowerCase().split(' ')[0];
  const primerasTres = apellido.trim().toLowerCase().slice(0, 3);

  return `${primerNombre}.${primerasTres}@${dominio}`;
}

function generarClaveTemporal(nombre, apellido, rut) {
  const inicialNombre = nombre.trim()[0].toUpperCase();
  const inicialApellido = apellido.trim()[0].toUpperCase();

  const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
  const cuerpo = rutLimpio.slice(0, -1);
  const ultimos4 = cuerpo.slice(-4);

  return `${inicialNombre}${inicialApellido}.${ultimos4}`;
}

/* LOGIN */
app.post('/login', async (req, res) => {
  try {
    const { user, password } = req.body;

    if (!user || !password) {
      return res.status(400).json({
        mensaje: 'Usuario y contraseña son obligatorios'
      });
    }

    if (
      user === process.env.ADMIN_USER &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        {
          user,
          rol: 'admin'
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({
        token,
        usuario: {
          nombre: 'Administrador',
          email: user,
          rol: 'admin'
        }
      });
    }

    const usuario = await UsuarioSistema.findOne({
      email: user
    });

    if (!usuario) {
      return res.status(401).json({
        mensaje: 'Usuario o contraseña incorrectos'
      });
    }

    if (usuario.estado !== 'activo') {
      return res.status(403).json({
        mensaje: 'Usuario inactivo'
      });
    }

    const passwordValida = await bcrypt.compare(
      password,
      usuario.passwordHash
    );

    if (!passwordValida) {
      return res.status(401).json({
        mensaje: 'Usuario o contraseña incorrectos'
      });
    }

    const token = jwt.sign(
      {
        id: usuario._id,
        email: usuario.email,
        rol: usuario.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        debeCambiarPassword: usuario.debeCambiarPassword
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al iniciar sesión'
    });
  }
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

app.post('/ficha-temporada', async (req, res) => {
  try {
    const datos = req.body;

    datos.edad = calcularEdad(datos.fechaNacimiento);
    datos.categoria = obtenerCategoria(datos.fechaNacimiento);

    if (typeof datos.numerosFavoritos === 'string') {
      datos.numerosFavoritos = datos.numerosFavoritos
        .split(',')
        .map((n) => Number(n.trim()))
        .filter((n) => !isNaN(n));
    }

    const ficha = new FichaTemporada(datos);

    await ficha.save();

    res.status(201).json({
      mensaje: 'Ficha guardada correctamente',
      ficha,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al guardar ficha',
    });
  }
});

app.get('/ficha-temporada', verificarToken, async (req, res) => {
  try {
    const fichas = await FichaTemporada.find().sort({
      categoria: 1,
      nombre: 1,
    });

    res.json(fichas);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener fichas',
    });
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

app.post('/profesores/crear-acceso', verificarToken, async (req, res) => {
  try {
    let {
      nombre,
      apellido,
      rut,
      fechaNacimiento,
      especialidad,
      experiencia,
      divisiones,
      telefono
    } = req.body;

    nombre = nombre?.trim();
    apellido = apellido?.trim();
    rut = rut?.trim();

    if (!nombre || !apellido || !rut) {
      return res.status(400).json({
        mensaje: 'Nombre, apellido y rut son obligatorios'
      });
    }

    const email = generarUsuario(nombre, apellido);
    const passwordTemporal = generarClaveTemporal(nombre, apellido, rut);

    const existeUsuario = await UsuarioSistema.findOne({ email });

    if (existeUsuario) {
      return res.status(400).json({
        mensaje: 'Ya existe un usuario con ese correo'
      });
    }

    const existeProfesor = await Profesor.findOne({ rut });

    if (existeProfesor) {
      return res.status(400).json({
        mensaje: 'Ya existe un profesor registrado con ese RUT'
      });
    }
    const profesor = await new Profesor({
      nombre,
      apellido,
      rut,
      fechaNacimiento,
      especialidad,
      experiencia,
      divisiones: Array.isArray(divisiones) ? divisiones : [],
      telefono,
      email,
      estadoSolicitud: 'aceptado',
      estado: 'activo',
      creadoPorAdmin: true
    }).save();

    const passwordHash = await bcrypt.hash(passwordTemporal, 10);

    await new UsuarioSistema({
      nombre: `${nombre} ${apellido}`,
      email,
      passwordHash,
      rol: 'profesor',
      profesorId: profesor._id,
      estado: 'activo',
      debeCambiarPassword: true
    }).save();

    res.status(201).json({
      mensaje: 'Profesor creado correctamente',
      credenciales: {
        email,
        passwordTemporal
      },
      profesor
    });

  } catch (error) {
    console.error('Error creando profesor:', error);

    res.status(500).json({
      mensaje: 'Error al crear profesor'
    });
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
crudRoutes(app, '/divisiones', Division);
crudRoutes(app, '/profesores', Profesor);

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
    const inscripcion = await Inscripcion.findById(req.params.id);

    if (!inscripcion) {
      return res.status(404).json({
        mensaje: 'Inscripción no encontrada'
      });
    }

    if (inscripcion.estado === 'aprobado') {
      return res.status(400).json({
        mensaje: 'La inscripción ya fue aprobada'
      });
    }

    const nombreApoderado = inscripcion.apoderado.nombre?.trim();
    const apellidos = inscripcion.apoderado.apellidos?.trim() || '';
    const rutPupilo = inscripcion.pupilo.rut?.trim();

    const apellidoPrincipal = apellidos.split(' ')[0] || 'user';

    const email = generarUsuario(nombreApoderado, apellidoPrincipal);
    const passwordTemporal = generarClaveTemporal(
      nombreApoderado,
      apellidoPrincipal,
      rutPupilo
    );

    const existeUsuario = await UsuarioSistema.findOne({ email });

    if (!existeUsuario) {
      const passwordHash = await bcrypt.hash(passwordTemporal, 10);

      await new UsuarioSistema({
        nombre: `${nombreApoderado} ${apellidos}`,
        email,
        passwordHash,
        rol: 'apoderado',
        estado: 'activo',
        debeCambiarPassword: true,
        inscripcionId: inscripcion._id
      }).save();
    }

    inscripcion.estado = 'aprobado';
    await inscripcion.save();

    res.json({
      mensaje: 'Inscripción aprobada correctamente',
      credenciales: {
        email,
        passwordTemporal
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al aprobar inscripción'
    });
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

app.post('/asistencias', verificarToken, async (req, res) => {
  try {
    const { jugadorId, fecha, estado, profesorId } = req.body;

    if (!jugadorId || !fecha) {
      return res.status(400).json({
        mensaje: 'Jugador y fecha son obligatorios'
      });
    }
    const fechaNormalizada = new Date(`${fecha}T00:00:00`);

    const existe = await Asistencia.findOne({
      jugadorId,
      fecha: fechaNormalizada
    });

    if (existe) {
      return res.status(400).json({
        mensaje: 'Ya existe asistencia para este jugador en esa fecha'
      });
    }

    const asistencia = await new Asistencia({
      jugadorId,
      fecha: fechaNormalizada,
      estado,
      profesorId
    }).save();

    res.status(201).json(asistencia);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al registrar asistencia'
    });
  }
});

app.get('/asistencias', verificarToken, async (req, res) => {
  try {
    const asistencias = await Asistencia.find()
      .populate('jugadorId', 'nombre categoria')
      .populate('profesorId', 'nombre apellido')
      .sort({ fecha: -1 });

    res.json(asistencias);

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener asistencias'
    });
  }
});

app.get('/asistencias/resumen/:jugadorId', verificarToken, async (req, res) => {
  try {
    const { jugadorId } = req.params;

    const asistencias = await Asistencia.find({ jugadorId });

    const totalClases = asistencias.length;

    const asistio = asistencias.filter(a => a.estado === 'asistio').length;
    const justificado = asistencias.filter(a => a.estado === 'justificado').length;
    const ausente = asistencias.filter(a => a.estado === 'ausente').length;

    const porcentaje = totalClases === 0
      ? 0
      : Number(((asistio / totalClases) * 100).toFixed(1));

    res.json({
      jugadorId,
      totalClases,
      asistio,
      justificado,
      ausente,
      porcentaje
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al obtener resumen'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});