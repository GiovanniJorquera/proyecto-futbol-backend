const mongoose = require('mongoose');

const jugadorSchema = new mongoose.Schema({
  fechaIngreso: {
    type: Date,
    default: Date.now
  },

  foto: String,

  nombre: {
    type: String,
    required: true,
    trim: true
  },

  direccion: {
    type: String,
    required: true
  },

  ciudad: {
    type: String,
    required: true
  },

  fechaNacimiento: {
    type: Date,
    required: true
  },

  cedula: {
    type: String,
    required: true
  },

  edad: Number,

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