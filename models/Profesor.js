const mongoose = require('mongoose');

const ProfesorSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  rut: { type: String, required: true, unique: true },
  fechaNacimiento: String,

  especialidad: String,
  experiencia: String,
  divisiones: [String],
  sede: String,

  telefono: String,

  email: {
    type: String,
    required: true
  },

  estadoSolicitud: {
    type: String,
    enum: ['pendiente', 'aceptado', 'rechazado'],
    default: 'pendiente'
  },

  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  },

  creadoPorAdmin: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Profesor', ProfesorSchema);