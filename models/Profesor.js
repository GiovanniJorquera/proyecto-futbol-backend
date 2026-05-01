const mongoose = require('mongoose');

const ProfesorSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  especialidad: String,
  experiencia: String,
  divisiones: [String],
  telefono: String,
  email: String,
}, { timestamps: true });

module.exports = mongoose.model('Profesor', ProfesorSchema);
