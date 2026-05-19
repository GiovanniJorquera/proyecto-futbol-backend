const mongoose = require('mongoose');

const subFisico = {
  velocidad:   { type: Number, min: 0, max: 100, default: 50 },
  agilidad:    { type: Number, min: 0, max: 100, default: 50 },
  resistencia: { type: Number, min: 0, max: 100, default: 50 },
  fuerza:      { type: Number, min: 0, max: 100, default: 50 },
  coordinacion:{ type: Number, min: 0, max: 100, default: 50 },
  promedio:    Number
};

const subTecnico = {
  controlDominio:      { type: Number, min: 0, max: 100, default: 50 },
  precisionEjecucion:  { type: Number, min: 0, max: 100, default: 50 },
  fluidezMovimiento:   { type: Number, min: 0, max: 100, default: 50 },
  usoPerfiles:         { type: Number, min: 0, max: 100, default: 50 },
  posturaCorporal:     { type: Number, min: 0, max: 100, default: 50 },
  promedio:    Number
};

const subActitudinal = {
  motivacion:         { type: Number, min: 0, max: 100, default: 50 },
  reaccionResultado:  { type: Number, min: 0, max: 100, default: 50 },
  apoyoCompanero:     { type: Number, min: 0, max: 100, default: 50 },
  deseosSuperacion:   { type: Number, min: 0, max: 100, default: 50 },
  resiliencia:        { type: Number, min: 0, max: 100, default: 50 },
  promedio:    Number
};

const subEstrategico = {
  tomaDecisiones:      { type: Number, min: 0, max: 100, default: 50 },
  lecturaJuego:        { type: Number, min: 0, max: 100, default: 50 },
  ocupacionEspacio:    { type: Number, min: 0, max: 100, default: 50 },
  transiciones:        { type: Number, min: 0, max: 100, default: 50 },
  cumplimientoPlan:    { type: Number, min: 0, max: 100, default: 50 },
  promedio:    Number
};

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

  psicologico: {
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
