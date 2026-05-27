const mongoose = require('mongoose');

const jugadorSchema = new mongoose.Schema({
  fechaIngreso: {
    type: Date,
    default: Date.now
  },

  foto: String,

  nombre: {
    type: String,
    default: '',
    trim: true
  },
  apellidoPaterno: {
  type: String,
  default: ''
  },

  apellidoMaterno: {
  type: String,
  default: ''
  },

  direccion: {
    type: String,
    default: ''
  },

  ciudad: {
    type: String,
    default: '' 
  },

  sede: {
    type: String,
    default: '' 
  },

  fechaNacimiento: {
    type: Date,
    default: Date.now
  },

  cedula: {
    type: String,
    default: ''
  },

  edad: {
    type: Number,
    default: 0
  },

  establecimiento: String,
  curso: String,
  clubAmateur: String,
  talla: String,

  numerosFavoritos: [Number],

  nombreCamiseta: String,

  posicion: {
    type: String,
    enum: ['Arquero', 'Defensa', 'Mediocampista', 'Delantero']
  },

  pieHabil: {
    type: String,
    enum: ['Derecho', 'Izquierdo', 'Ambidiestro']
  },

  aniosJugando: Number,

  otrosDeportes: String,
  otrasEscuelas: String,

  actitudSocial: {
    type: String,
    enum: ['Introvertido', 'Extrovertido', 'Mixto']
  },

  actitudAdversidad: String,

  categoria: String,

  apoderado: {
    nombre: String,
    direccion: String,
    ciudad: String,
    rut: String,
    correo: String,
    telefonoCasa: String,
    whatsapp: String,
    vinculo: String
  }
});

module.exports = mongoose.model('Jugador', jugadorSchema);