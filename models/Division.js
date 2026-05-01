const mongoose = require('mongoose');

const DivisionSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  categoria: String,
  profesorPrincipal: String,
  estudiantes: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Division', DivisionSchema);
