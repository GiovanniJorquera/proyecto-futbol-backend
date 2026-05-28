require('dotenv').config();

const fs = require('fs');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ Falta MONGODB_URI en .env');
  process.exit(1);
}

const NOMBRE_BD = 'futbol-dev';
const COLECCION = 'fichatemporadas';

const client = new MongoClient(uri);

function limpiar(v) {
  if (!v) return '';
  const t = String(v).trim();
  return /^faltante$/i.test(t) ? '' : t;
}

function normalizarCategoria(v) {
  if (!v) return '';
  const m = v.trim().match(/^sub[-_\s]?(\d+)$/i);
  return m ? `Sub-${m[1]}` : v.trim();
}

function calcularEdad(fecha) {
  if (!fecha) return null;
  const hoy = new Date();
  const nac = new Date(fecha);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function parsearFecha(texto) {
  if (!texto) return null;
  const partes = texto.trim().split('-');
  if (partes.length !== 3) return null;
  const [dia, mes, anio] = partes.map(Number);
  if (!anio || anio < 1900 || !mes || mes < 1 || mes > 12) return null;
  const d = dia >= 1 && dia <= 31 ? dia : 1;
  return new Date(anio, mes - 1, d);
}

function detectarDelimitador(linea) {
  const comas = (linea.match(/,/g) || []).length;
  const puntos = (linea.match(/;/g) || []).length;
  return comas >= puntos ? ',' : ';';
}

async function importarCSV() {
  try {
    await client.connect();
    console.log(`🟢 Conectado | BD: ${NOMBRE_BD} | Colección: ${COLECCION}`);

    const database = client.db(NOMBRE_BD);
    const collection = database.collection(COLECCION);

    const archivo = fs.readFileSync('jugadores_vina.csv', 'utf-8');
    const lineas = archivo.split('\n').filter(l => l.trim());

    const delim = detectarDelimitador(lineas[0]);
    console.log(`🔍 Delimitador detectado: "${delim}"`);

    const cabeceras = lineas[0].split(delim).map(c => c.trim());
    console.log('📋 Cabeceras:', cabeceras);

    const jugadores = [];

    for (let i = 1; i < lineas.length; i++) {
      const columnas = lineas[i].split(delim);
      const fila = {};
      cabeceras.forEach((cab, idx) => {
        fila[cab] = columnas[idx] ? columnas[idx].trim() : '';
      });

      const nombre = limpiar(fila['NOMBRE']);
      if (!nombre) continue;

      const apellidoPaterno = limpiar(fila['APELLIDO PATERNO']);
      const apellidoMaterno = limpiar(fila['APELLIDO MATERNO']);
      const apellido = [apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ');

      const fechaNacimiento = parsearFecha(fila['FECHA DE NACIEMIENTO']);
      const categoria = normalizarCategoria(fila['CATEGORIA']);

      jugadores.push({
        fechaIngreso: new Date(),
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        apellido,
        fechaNacimiento,
        edad: calcularEdad(fechaNacimiento),
        categoria,
        sede: 'VIÑA',
        direccion: '',
        ciudad: '',
        cedula: '',
        establecimiento: '',
        curso: '',
        clubAmateur: '',
        talla: '',
        numerosFavoritos: [],
        nombreCamiseta: '',
        posicion: null,
        pieHabil: null,
        aniosJugando: null,
        otrosDeportes: '',
        otrasEscuelas: '',
        actitudSocial: null,
        actitudAdversidad: '',
        apoderado: {
          nombre: '',
          direccion: '',
          ciudad: '',
          rut: '',
          correo: '',
          telefonoCasa: '',
          whatsapp: '',
          vinculo: ''
        }
      });
    }

    console.log(`📦 Jugadores preparados: ${jugadores.length}`);

    if (jugadores.length === 0) {
      console.log('❌ No se encontraron jugadores válidos');
      return;
    }

    console.log('📝 Primeros 3 registros:');
    jugadores.slice(0, 3).forEach(j => {
      const fecha = j.fechaNacimiento ? j.fechaNacimiento.toISOString().slice(0, 10) : 'sin fecha';
      console.log(`  ${j.apellido || '(sin apellido)'}, ${j.nombre} | ${j.categoria} | ${fecha}`);
    });

    const resultado = await collection.insertMany(jugadores);
    console.log(`✅ ${resultado.insertedCount} jugadores importados a "${NOMBRE_BD}/${COLECCION}"`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

importarCSV();
