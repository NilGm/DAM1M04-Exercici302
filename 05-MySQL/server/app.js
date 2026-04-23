]const express = require('express');
const { engine } = require('express-handlebars');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const port = 3000;

// 1. CONFIGURAR HANDLEBARS
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: false, 
    partialsDir: path.join(__dirname, 'views/partials') 
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// 2. CONTENIDOS ESTÁTICOS Y MIDDLEWARES
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true })); // Per llegir dades de formularis POST

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
});

// 3. CONEXIÓN MYSQL
const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Calamot2023',
    database: 'sakila',
    waitForConnections: true,
    connectionLimit: 10
});

// --- RUTES GET ---

// A) Home
app.get('/', async (req, res) => {
    try {
        const [movies] = await pool.query('SELECT title, release_year FROM film LIMIT 5');
        const [categories] = await pool.query('SELECT name FROM category LIMIT 5');
        
        res.render('index', { 
            titolGlobal: 'Sakila Movies',
            any: new Date().getFullYear(),
            movies: movies, 
            categories: categories 
        });
    } catch (error) {
        res.render('index', { movies: [], categories: [] });
    }
});

// B) Llistat de Pel·lícules (CORREGIT: Afegit film_id i ORDER BY)
app.get('/movies', async (req, res) => {
    try {
        const [movies] = await pool.query(`
            SELECT f.film_id, f.title, f.description, f.release_year, f.rating, 
                   GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ') as actors 
            FROM film f 
            LEFT JOIN film_actor fa ON f.film_id = fa.film_id 
            LEFT JOIN actor a ON fa.actor_id = a.actor_id 
            GROUP BY f.film_id 
            ORDER BY f.film_id DESC 
            LIMIT 20`);
            
        res.render('movies', { 
            titolGlobal: 'Sakila Movies',
            any: 2026,
            movies: movies 
        });
    } catch (err) { 
        res.status(500).send("Error a la ruta /movies: " + err.message); 
    }
});

// C) Vista detallada
app.get('/movie/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT f.*, l.name as language 
            FROM film f 
            JOIN language l ON f.language_id = l.language_id 
            WHERE f.film_id = ?`, [req.params.id]);
        
        res.render('movie', { 
            movie: rows[0], 
            titolGlobal: 'Sakila Movies', 
            any: 2026 
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// D) Vista formulari afegir
app.get('/movieAdd', (req, res) => {
    res.render('movieAdd', { titolGlobal: 'Sakila Movies', any: 2026 });
});

// E) Vista editar
app.get('/movieEdit/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM film WHERE film_id = ?', [req.params.id]);
        res.render('movieEdit', { movie: rows[0], titolGlobal: 'Sakila Movies', any: 2026 });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// F) Clients
app.get('/customers', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT first_name, last_name, email FROM customer LIMIT 25');
        res.render('customers', { 
            titolGlobal: 'Sakila Movies',
            any: 2026,
            customers: rows 
        }); 
    } catch (error) {
        res.status(500).send("Error");
    }
});

// --- RUTES POST (ACCIONS) ---

// A) Afegir
app.post('/afegirPeli', async (req, res) => {
    const { title, description, release_year, language_id } = req.body;
    try {
        await pool.query(
            'INSERT INTO film (title, description, release_year, language_id) VALUES (?, ?, ?, ?)', 
            [title.toUpperCase(), description, release_year, language_id]
        );
        res.redirect('/movies');
    } catch (err) { 
        res.status(500).send("Error al crear: " + err.message); 
    }
});

// B) Editar
app.post('/editarPeli', async (req, res) => {
    const { film_id, title, description } = req.body;
    try {
        await pool.query(
            'UPDATE film SET title = ?, description = ? WHERE film_id = ?', 
            [title.toUpperCase(), description, film_id]
        );
        res.redirect('/movie/' + film_id);
    } catch (err) { 
        res.status(500).send("Error al editar: " + err.message); 
    }
});

// C) Esborrar
app.post('/esborrarPeli', async (req, res) => {
    const { film_id } = req.body;
    try {
        await pool.query('DELETE FROM film WHERE film_id = ?', [film_id]);
        res.redirect('/movies');
    } catch (err) { 
        res.status(500).send("No es pot esborrar: Segurament aquesta peli té actors o lloguers registrats."); 
    }
});

// ACTIVAR SERVIDOR
const httpServer = app.listen(port, () => {
    console.log(`Servidor engegat a: http://localhost:${port}`);
});

// APAGADO LIMPIO
const shutDown = () => {
    httpServer.close(() => {
        process.exit(0);
    });
};
process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);
