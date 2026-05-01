const mongoose = require('mongoose');

const PagoSchema = new mongoose.Schema({
  apoderado: {
    type: String,
    required: true,
    trim: true,
  },
  alumno: {
    type: String,
    required: true,
    trim: true,
  },
  sede: {
    type: String,
    enum: ['Sede 1', 'Sede 2'],
    required: true,
  },
  monto: {
    type: Number,
    required: true,
    min: 0,
  },
  fecha: {
    type: String,
    required: true,
  },
  voucherBase64: {
    type: String,
    required: true,
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado'],
    default: 'pendiente',
  },
  fechaRegistro: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Pago', PagoSchema);