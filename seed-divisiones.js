require('dotenv').config();
const mongoose = require('mongoose');
const Division = require('./models/Division'); // Asegurar que la ruta al modelo sea correcta

const divisionesFijas = [
  { nombre: 'Sub-6', descripcion: 'Categoría infantil Sub-6', edadMinima: 5, edadMaxima: 6 },
  { nombre: 'Sub-8', descripcion: 'Categoría infantil Sub-8', edadMinima: 7, edadMaxima: 8 },
  { nombre: 'Sub-10', descripcion: 'Categoría infantil Sub-10', edadMinima: 9, edadMaxima: 10 },
  { nombre: 'Sub-12', descripcion: 'Categoría infantil Sub-12', edadMinima: 11, edadMaxima: 12 },
  { nombre: 'Sub-14', descripcion: 'Categoría juvenil Sub-14', edadMinima: 13, edadMaxima: 14 },
  { nombre: 'Sub-16', descripcion: 'Categoría juvenil Sub-16', edadMinima: 15, edadMaxima: 16 },
  { nombre: 'Sub-18', descripcion: 'Categoría juvenil Sub-18', edadMinima: 17, edadMaxima: 18 },
  { nombre: 'Femenina', descripcion: 'Categoría Femenina Todo Competidor', edadMinima: null, edadMaxima: null }
];

async function seedDivisiones() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ Falta MONGODB_URI en las variables de entorno.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Conectado exitosamente a MongoDB Atlas...');

    // 1. Validar si ya existen divisiones instaladas
    const conteo = await Division.countDocuments();
    if (conteo > 0) {
      console.log(`⚠️ Ya existen ${conteo} divisiones en la base de datos. No se realizaron cambios para evitar duplicados.`);
      return;
    }

    // 2. Insertar las divisiones oficiales
    await Division.insertMany(divisionesFijas);
    console.log('🎉 ¡Éxito! Las 8 divisiones oficiales han sido fijadas en el sistema.');

  } catch (error) {
    console.error('❌ Hubo un error al fijar las divisiones:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Conexión cerrada.');
  }
}

seedDivisiones();
