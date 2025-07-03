const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // para servir archivos estáticos (como tu app.js si quieres)

// Configura conexión a MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Telco0032',
  database: 'tasksdb'  // Cambia esto por el nombre de tu base de datos
});

// Conecta a MySQL
connection.connect(err => {
  if (err) {
    console.error('Error conectando a la BD:', err);
    process.exit(1);
  }
  console.log('Conectado a MySQL');
});

// Crear tabla tasks si no existe
const createTableQuery = `
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  priority VARCHAR(50) NOT NULL
)`;

connection.query(createTableQuery, err => {
  if (err) console.error('Error creando tabla tasks:', err);
});

// Rutas API

// Obtener todas las tareas
app.get('/api/tasks', (req, res) => {
  connection.query('SELECT * FROM tasks', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
    res.send('¡Servidor funcionando! Bienvenido a la API.');
  });
});

// Agregar nueva tarea
app.post('/api/tasks', (req, res) => {
  const { title, priority } = req.body;
  if (!title || !priority) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  connection.query(
    'INSERT INTO tasks (title, priority) VALUES (?, ?)',
    [title, priority],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, title, priority });
    }
  );
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});
