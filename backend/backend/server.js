const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'pakazita_secret_key_2026';

// --- Conexión a PostgreSQL en Render ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;

// Ruta base (Muestra la tienda web)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/frontend/index.html');
});
// --- RUTAS DE PRODUCTOS ---
app.get('/api/productos', (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// --- RUTAS DE USUARIOS ---
// Registro
app.post('/api/usuarios/registro', async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
    db.query(sql, [nombre, email, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ mensaje: 'Usuario registrado con éxito', usuarioId: result.insertId });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Login
app.post('/api/usuarios/login', (req, res) => {
  const { email, password } = req.body;
  
  db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const usuario = results[0];
    const passwordMatch = await bcrypt.compare(password, usuario.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    });
  });
});

// --- RUTAS DE PEDIDOS ---
// Crear un nuevo pedido
app.post('/api/pedidos', (req, res) => {
  const { usuario_id, total } = req.body;
  if (!total) return res.status(400).json({ error: 'El total del pedido es requerido' });

  const sql = 'INSERT INTO pedidos (usuario_id, total) VALUES (?, ?)';
  db.query(sql, [usuario_id || null, total], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Pedido registrado con éxito', pedidoId: result.insertId });
  });
});

// Consultar pedidos
app.get('/api/pedidos', (req, res) => {
  const sql = `
    SELECT p.id, p.total, p.estado, p.creado_en, u.nombre AS usuario 
    FROM pedidos p 
    LEFT JOIN usuarios u ON p.usuario_id = u.id 
    ORDER BY p.creado_en DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor PakaZita en http://localhost:${PORT}`);
});