const mongoose = require('mongoose');

const EstudianteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  rut: String,
  division: String,
  fechaIngreso: String,
  telefono: String,
  email: String,
}, { timestamps: true });

module.exports = mongoose.model('Estudiante', EstudianteSchema);
