const express = require('express');
const { engine } = require('express-handlebars');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const port = 3000;

// 1. CONFIGURAR HANDLEBARS
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: false, // Volvemos a false porque usas partials (header, menu, footer)
    partialsDir: path.join(__dirname, 'views/partials') 
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// 2. CONTENIDOS ESTÁTICOS Y CACHE
// ¡CORRECCIÓN CLAVE!: Ponemos '../public' para que salga de la carpeta 'server' y encuentre el CSS
app.use(express.static(path.join(__dirname, '../public')));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
});

// 3. CONEXIÓN MYSQL (Pool de conexiones)
const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Calamot2023',
    database: 'sakila',
    waitForConnections: true,
    connectionLimit: 10
});

// --- RUTES ---

// A) RUTA PRINCIPAL (Home - index.hbs)
app.get('/', async (req, res) => {
    try {
        const [movies] = await pool.query('SELECT title, release_year FROM film LIMIT 5');
        const [categories] = await pool.query('SELECT name FROM category LIMIT 5');
        
        res.render('index', { 
            titolPagina: 'Benvinguts a Sakila', 
            titolGlobal: 'Sakila Movies',
            any: new Date().getFullYear(),
            movies: movies, 
            categories: categories 
        });
    } catch (error) {
        console.error("Error en la home:", error);
        res.render('index', { titolPagina: 'Inici', movies: [], categories: [] });
    }
});

// B) RUTA CLIENTS (customers.hbs)
app.get('/customers', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT first_name, last_name, email FROM customer LIMIT 25');
        
        res.render('customers', { 
            titolPagina: 'Llistat de Clients', 
            titolGlobal: 'Sakila Movies',
            any: new Date().getFullYear(),
            customers: rows 
        }); 
    } catch (error) {
        console.error("Error en clientes:", error);
        res.status(500).send("Error al carregar els clients");
    }
});

// C) RUTA PEL·LÍCULES (movies.hbs)
app.get('/movies', async (req, res) => {
    try {
        const [movies] = await pool.query(`
            SELECT f.title, f.description, f.release_year, f.rating, 
                   GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ') as actors 
            FROM film f 
            LEFT JOIN film_actor fa ON f.film_id = fa.film_id 
            LEFT JOIN actor a ON fa.actor_id = a.actor_id 
            GROUP BY f.film_id 
            LIMIT 15`);
            
        res.render('movies', { 
            titolPagina: 'Llistat de Pel·lícules', 
            titolGlobal: 'Sakila Movies',
            any: new Date().getFullYear(),
            movies: movies 
        });
    } catch (err) { 
        res.status(500).send("Error a la ruta /movies: " + err.message); 
    }
});

// ACTIVAR SERVIDOR
const httpServer = app.listen(port, () => {
    console.log(`Servidor engegat a: http://localhost:${port}`);
});

// APAGADO LIMPIO
const shutDown = () => {
    console.log('Tancant servidor...');
    httpServer.close(() => {
        process.exit(0);
    });
};

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);