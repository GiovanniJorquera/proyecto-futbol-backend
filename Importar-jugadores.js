require('dotenv').config();
const fs = require('fs');
const { MongoClient } = require('mongodb');

// Usar la misma URI que el backend
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ Falta MONGODB_URI en las variables de entorno');
  process.exit(1);
}

// Extraer el nombre de la BD de la URI (formato: mongodb://.../?authSource=admin&...)
// La BD se especifica después del último / y antes del ?
function extraerNombreBaseDatos(mongoUri) {
  const match = mongoUri.match(/\/([^/?]+)\?/);
  return match ? match[1] : 'test';
}

const NOMBRE_BD = extraerNombreBaseDatos(uri);
const COLECCION = 'fichatemporadas'; // Nombre exacto de la colección

// Funciones de cálculo (copiadas de server.js)
function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return edad;
}

function obtenerCategoria(fechaNacimiento) {
  const edad = calcularEdad(fechaNacimiento);

  if (edad <= 6) return 'Sub-6';
  if (edad <= 8) return 'Sub-8';
  if (edad <= 10) return 'Sub-10';
  if (edad <= 12) return 'Sub-12';
  if (edad <= 14) return 'Sub-14';
  if (edad <= 16) return 'Sub-16';
  if (edad <= 18) return 'Sub-18';

  return 'Libre';
}

async function importarCSV() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db(NOMBRE_BD);
        const collection = database.collection(COLECCION);

        console.log(`📡 Conectado a BD: ${NOMBRE_BD}`);
        console.log(`📍 Colección destino: ${COLECCION}`);

        // Leer el archivo CSV
        const archivo = fs.readFileSync('Agregar_jugadores.csv', 'utf-8');
        const lineas = archivo.split('\n');
        
        // Obtener las cabeceras (la primera fila del CSV)
        // El delimitador es ; (punto y coma)
        const cabeceras = lineas[0].split(';').map(c => c.trim());
        console.log(`📋 Cabeceras detectadas: ${cabeceras.join(', ')}`);

        const fichas = [];

        // Procesar cada fila
        for (let i = 1; i < lineas.length; i++) {
            if (!lineas[i].trim()) continue;
            
            const columnas = lineas[i].split(';');
            const fila = {};
            
            cabeceras.forEach((cabecera, index) => {
                const valor = columnas[index] ? columnas[index].trim() : null;
                fila[cabecera] = valor === "" || valor === "FALTANTE" || valor === "00-00-00" ? null : valor;
            });

            // Mapeo a FichaTemporadaSchema
            const ficha = {
                fechaIngreso: new Date(),
                nombre: fila.nombre || 'Sin nombre',
                fechaNacimiento: fila.fechaNacimiento,
                cedula: null, // No viene en el CSV
                clubAmateur: fila.clubAmateur || null,
                // Los campos calculados
                edad: fila.fechaNacimiento ? calcularEdad(fila.fechaNacimiento) : null,
                categoria: fila.fechaNacimiento ? obtenerCategoria(fila.fechaNacimiento) : null,
                // Campos opcionales del schema
                direccion: null,
                ciudad: null,
                establecimiento: null,
                curso: null,
                talla: null,
                numerosFavoritos: [],
                nombreCamiseta: null,
                posicion: null,
                pieHabil: null,
                aniosJugando: null,
                otrosDeportes: null,
                otrasEscuelas: null,
                actitudSocial: null,
                actitudAdversidad: null,
                beca: false,
                apoderado: {
                  nombre: null,
                  direccion: null,
                  ciudad: null,
                  rut: null,
                  correo: null,
                  telefonoCasa: null,
                  whatsapp: null,
                  vinculo: null
                }
            };

            fichas.push(ficha);
        }

        // Insertar en MongoDB
        if (fichas.length > 0) {
            const resultado = await collection.insertMany(fichas);
            console.log(`\n✅ ¡Éxito! Se insertaron ${resultado.insertedCount} jugadores en ${COLECCION}`);
            console.log(`📊 Detalles:`);
            console.log(`   - Base de datos: ${NOMBRE_BD}`);
            console.log(`   - Colección: ${COLECCION}`);
            console.log(`   - Registros: ${resultado.insertedCount}`);
        } else {
            console.log("❌ No se encontraron jugadores para importar.");
        }

    } catch (error) {
        console.error("❌ Hubo un error al importar:", error.message);
    } finally {
        await client.close();
    }
}

importarCSV();