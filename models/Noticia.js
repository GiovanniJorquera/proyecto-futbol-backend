const mongoose = require('mongoose');

const NoticiaSchema = new mongoose.Schema({
  titulo:     { type: String, required: true },
  descripcion: String,
  contenido:  String,
  fecha:      String,
  imagenUrl:  String,
  categoria:  { type: String, enum: ['Entrenamiento', 'Partido', 'Evento'], default: 'Evento' },
}, { timestamps: true });

module.exports = mongoose.model('Noticia', NoticiaSchema);
