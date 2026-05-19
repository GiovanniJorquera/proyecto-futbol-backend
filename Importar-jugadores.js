const fs = require('fs');
const { MongoClient } = require('mongodb');

// Tu cadena de conexión real
const uri = "mongodb://admin_futbol:admin1234@ac-fciiufa-shard-00-00.buyvgun.mongodb.net:27017,ac-fciiufa-shard-00-01.buyvgun.mongodb.net:27017,ac-fciiufa-shard-00-02.buyvgun.mongodb.net:27017/?ssl=true&replicaSet=atlas-i5q9yi-shard-0&authSource=admin&appName=Cluster0";

// Pon aquí el nombre exacto de tu base de datos y tu colección
const NOMBRE_BD = "futbol-dev"; 
const COLECCION = "jugadors"; 

async function importarCSV() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db(NOMBRE_BD);
        const collection = database.collection(COLECCION);

        // Leer el archivo CSV con tu nombre exacto
        const archivo = fs.readFileSync('Agregar_jugadores.csv', 'utf-8');
        const lineas = archivo.split('\n');
        
        // Obtener las cabeceras (la primera fila del Excel)
        const cabeceras = lineas[0].split(',').map(c => c.trim());
        const jugadores = [];

        // Procesar cada fila
        for (let i = 1; i < lineas.length; i++) {
            if (!lineas[i].trim()) continue;
            
            const columnas = lineas[i].split(',');
            let jugador = {};
            
            cabeceras.forEach((cabecera, index) => {
                let valor = columnas[index] ? columnas[index].trim() : null;
                // Si el valor está vacío, lo dejamos como null
                jugador[cabecera] = valor === "" ? null : valor;
            });
            
            // CORREGIDO: Usamos .push() en vez de .add()
            jugadores.push(jugador);
        }

        // Insertar en MongoDB
        if (jugadores.length > 0) {
            const resultado = await collection.insertMany(jugadores);
            console.log(`¡Éxito! Se insertaron ${resultado.insertedCount} jugadores en el sistema.`);
        } else {
            console.log("No se encontraron jugadores para importar.");
        }

    } catch (error) {
        console.error("Hubo un error al importar:", error);
    } finally {
        await client.close();
    }
}

importarCSV();