const mongoose = require('mongoose');

const RendimientoSchema = new mongoose.Schema({
  jugadorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Jugador',
    required: true
  },

  profesorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profesor'
  },

  profesorEmail: {
    type: String,
    default: ''
  },

  fecha: {
    type: Date,
    default: Date.now
  },

  velocidad: {
    type: Number,
    min: 1,
    max: 10
  },

  resistencia: {
    type: Number,
    min: 1,
    max: 10
  },

  tecnica: {
    type: Number,
    min: 1,
    max: 10
  },

  disciplina: {
    type: Number,
    min: 1,
    max: 10
  },

  comentario: {
    type: String,
    default: ''
  },

  fisico: {
    type: Number,
    min: 1,
    max: 5
  },

  tecnico: {
    type: Number,
    min: 1,
    max: 5
  },

  Actitudinal: {
    type: Number,
    min: 1,
    max: 5
  },

  estrategico: {
    type: Number,
    min: 1,
    max: 5
  },

  notas: {
    type: String,
    default: ''
  },

  promedio: {
    type: Number
  }

}, { timestamps: true });

module.exports = mongoose.model('Rendimiento', RendimientoSchema);