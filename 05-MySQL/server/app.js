/*const express = require('express');
const hbs = require('hbs');
const path = require('path');
const fs = require('fs');
const MySQL = require('./utilsMySQL');

const app = express();
const port = 3000;

// Detectar si estem al Proxmox (si és pm2)
const isProxmox = !!process.env.PM2_HOME;

// Iniciar connexió MySQL
const db = new MySQL();
if (!isProxmox) {
  db.init({
    host: '127.0.0.1',
    port: 3306,
    user: 'system',
    password: 'Calamot2023',
    database: 'sakila'
  });
} else {
  db.init({
    host: '127.0.0.1',
    port: 3306,
    user: 'super',
    password: '1234',
    database: 'escola'
  });
}


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


// RUTES
app.get('/', async (req, res) => {
    const moviesRows = await db.query(`SELECT film_id, title, release_year FROM film LIMIT 5`);
    const categRows = await db.query(`SELECT * FROM category LIMIT 5`);

    const moviesJson = db.table_to_json(cursosRows, {
      film_id: 'number',
      title: 'string',
      release_year: 'string'
    });

    console.log(moviesJson)


    //res.render('index', { ...commonData, movies, categories });
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
*/

const express = require('express');
const fs = require('fs');
const path = require('path');
const hbs = require('hbs');
const MySQL = require('./utilsMySQL');

const app = express();
const port = 3000;

// Detectar si estem al Proxmox (si és pm2)
const isProxmox = !!process.env.PM2_HOME;

// Iniciar connexió MySQL
const db = new MySQL();
if (!isProxmox) {
  db.init({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Calamot2023',
    database: 'sakila'
  });
} else {
  db.init({
    host: '127.0.0.1',
    port: 3306,
    user: 'super',
    password: '1234',
    database: 'escola'
  });
}

// Static files - ONLY ONCE
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

// Disable cache
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Handlebars
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Registrar "Helpers .hbs" aquí
hbs.registerHelper('eq', (a, b) => a == b);
hbs.registerHelper('gt', (a, b) => a > b);

// Partials de Handlebars
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// Route
app.get('/', async (req, res) => {
    const moviesRows = await db.query(`SELECT film_id, title, release_year FROM film LIMIT 5`);
    const categRows = await db.query(`SELECT * FROM category LIMIT 5`);

    const moviesJson = db.table_to_json(movi, {
      film_id: 'number',
      title: 'string',
      release_year: 'string'
    });

    console.log(moviesJson)


    //res.render('index', { ...commonData, movies, categories });
});


app.get('/cursos', async (req, res) => {
  try {

    // Obtenir les dades de la base de dades
    const cursosRows = await db.query(`
      SELECT
        c.id,
        c.nom,
        c.tematica,
        COALESCE(
          GROUP_CONCAT(DISTINCT m.nom ORDER BY m.nom SEPARATOR ', '),
          '—'
        ) AS mestre_nom
      FROM cursos c
      LEFT JOIN mestre_curs mc ON mc.curs_id = c.id
      LEFT JOIN mestres m ON m.id = mc.mestre_id
      GROUP BY c.id, c.nom, c.tematica
      ORDER BY c.id;
    `);

    // Transformar les dades a JSON (per les plantilles .hbs)
    const cursosJson = db.table_to_json(cursosRows, {
      id: 'number',
      nom: 'string',
      tematica: 'string',
      mestre_nom: 'string'
    });

    // Llegir l'arxiu .json amb dades comunes per a totes les pàgines
    const commonData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'common.json'), 'utf8')
    );

    // Construir l'objecte de dades per a la plantilla
    const data = {
      cursos: cursosJson,
      common: commonData
    };

    // Renderitzar la plantilla amb les dades
    res.render('cursos', data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error consultant la base de dades');
  }
});

// Start server
const httpServer = app.listen(port, () => {
  console.log(`http://localhost:${port}`);
  console.log(`http://localhost:${port}/cursos`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await db.end();
  httpServer.close();
  process.exit(0);
});