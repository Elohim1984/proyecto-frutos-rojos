const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Servir la carpeta frontend de forma estática
app.use(express.static(path.join(__dirname, '../frontend')));

const JWT_SECRET = 'pakazita_secret_key_2026';

// --- Conexión a PostgreSQL en Render ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;

// --- Ruta base (Muestra la tienda web completa) ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
// --- RUTAS DE PRODUCTOS ---
app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Configuración del Puerto para Render ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor PakaZita activo en puerto ${PORT}`);
});