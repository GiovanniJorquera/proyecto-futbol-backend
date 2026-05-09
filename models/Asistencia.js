const mongoose = require('mongoose');

const AsistenciaSchema = new mongoose.Schema({
  jugadorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FichaTemporada',
    required: true
  },

  fecha: {
    type: Date,
    required: true
  },

  estado: {
    type: String,
    enum: ['asistio', 'ausente', 'justificado'],
    default: 'asistio'
  },

  profesorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profesor'
  }
}, { timestamps: true });

module.exports = mongoose.model('Asistencia', AsistenciaSchema);