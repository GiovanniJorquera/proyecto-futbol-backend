const mongoose = require('mongoose');

const SiteConfigSchema = new mongoose.Schema({
  tituloHeader:        { type: String, default: 'Escuela de Futbol - Inicio' },
  tituloBienvenida:    { type: String, default: '¡Bienvenidos Crack!' },
  subtituloBienvenida: { type: String, default: 'Revisa las últimas novedades de tu club.' },
  imagenDestacada:     { type: String, default: '' },
  imagenesCarrusel:    { type: [String], default: [] },
  imagenesGaleria:     { type: [{ url: String, descripcion: String }], default: [] },
});

module.exports = mongoose.model('SiteConfig', SiteConfigSchema);
