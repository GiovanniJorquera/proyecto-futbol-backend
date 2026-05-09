const mongoose = require('mongoose');

const UsuarioSistemaSchema = new mongoose.Schema({
  nombre: String,
  email: {
    type: String,
    unique: true,
  },
  passwordHash: String,
  rol: {
    type: String,
    enum: ['admin', 'profesor', 'cliente'],
    required: true,
  },
  profesorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profesor',
  },
  estado: {
    type: String,
    default: 'pendiente',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  debeCambiarPassword: {
  type: Boolean,
  default: true
  },
});

module.exports = mongoose.model('UsuarioSistema', UsuarioSistemaSchema);