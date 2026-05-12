const mongoose = require('mongoose');

const RendimientoSchema = new mongoose.Schema({
  jugadorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Jugador',
    required: true
  },

  profesorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profesor',
    required: true
  },

  velocidad: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },

  resistencia: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },

  tecnica: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },

  disciplina: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },

  promedio: {
  type: Number
},

  comentario: {
    type: String,
    default: ''
  },

  fecha: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

module.exports = mongoose.model('Rendimiento', RendimientoSchema);