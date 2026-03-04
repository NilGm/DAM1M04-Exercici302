const express = require('express');
const hbs = require('hbs');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Carregar dades comunes
const commonData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/common.json'), 'utf8'));

// Configuració HBS
app.engine('hbs', engine({
	extname: '.hbs',
	defaultLayout: false,
		partialsDir: path.join(__dirname, 'views','partials'),
}));
app.set('view engine','hbs');
app.set('views', path.join(__dirname,'views'));
// Connexió a MySQL (Ajusta amb les teves credencials de Proxmox/Local)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'sakila'
});

// RUTES
app.get('/', async (req, res) => {
    const [movies] = await pool.query('SELECT film_id, title, release_year FROM film LIMIT 5');
    const [categories] = await pool.query('SELECT * FROM category LIMIT 5');
    res.render('index', { ...commonData, movies, categories });
});

app.get('/movies', async (req, res) => {
    // Consulta complexa per portar pel·lícules i els seus actors concatenats
    const query = `
        SELECT f.title, f.description, GROUP_CONCAT(a.first_name, ' ', a.last_name SEPARATOR ', ') as actors
        FROM film f
        JOIN film_actor fa ON f.film_id = fa.film_id
        JOIN actor a ON fa.actor_id = a.actor_id
        GROUP BY f.film_id LIMIT 15`;
    const [movies] = await pool.query(query);
    res.render('movies', { ...commonData, movies });
});

app.get('/customers', async (req, res) => {
    const [customers] = await pool.query('SELECT customer_id, first_name, last_name FROM customer LIMIT 25');
    
    // Per cada client, busquem els seus 5 últims lloguers
    for (let c of customers) {
        const [rentals] = await pool.query(`
            SELECT r.rental_date, f.title 
            FROM rental r
            JOIN inventory i ON r.inventory_id = i.inventory_id
            JOIN film f ON i.film_id = f.film_id
            WHERE r.customer_id = ? LIMIT 5`, [c.customer_id]);
        c.rentals = rentals;
    }
    res.render('customers', { ...commonData, customers });
});

app.listen(port, () => console.log(`Servidor a http://localhost:${port}`));
