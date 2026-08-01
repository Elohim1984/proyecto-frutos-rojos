const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos de la carpeta frontend y Public
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, '../Public')));

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// ==========================================
// RUTAS DE LA APLICACIÓN Y ADMINISTRADOR
// ==========================================

// Ruta Principal (Tienda / PakaZita)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Ruta del Panel de Administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../Public', 'admin.html'));
});

// Estadísticas generales para el Panel
app.get('/api/admin/stats', async (req, res) => {
    try {
        const totalClientes = await pool.query('SELECT COUNT(*) FROM clientes');
        const totalPedidos = await pool.query('SELECT COUNT(*) FROM pedidos');
        const ingresosTotales = await pool.query('SELECT SUM(total) FROM pedidos');
        
        const pedidosRecientes = await pool.query(`
            SELECT p.id, c.nombre, p.fecha_creacion, p.total, p.estado 
            FROM pedidos p 
            JOIN clientes c ON p.cliente_id = c.id 
            ORDER BY p.fecha_creacion DESC 
            LIMIT 10
        `);

        const clientesFrecuentes = await pool.query(`
            SELECT c.nombre, c.telefono, COUNT(p.id) as total_pedidos, SUM(p.total) as total_gastado
            FROM clientes c 
            LEFT JOIN pedidos p ON c.id = p.cliente_id
            GROUP BY c.id, c.nombre, c.telefono 
            ORDER BY total_pedidos DESC 
            LIMIT 5
        `);

        res.json({
            clientesTotales: totalClientes.rows[0].count,
            totalPedidos: totalPedidos.rows[0].count,
            ingresosTotales: ingresosTotales.rows[0].sum || 0,
            pedidosRecientes: pedidosRecientes.rows,
            clientesFrecuentes: clientesFrecuentes.rows
        });
    } catch (err) {
        console.error('Error al obtener estadísticas del panel:', err);
        res.status(500).send('Error interno en el servidor');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de PakaZita corriendo en el puerto ${PORT}`);
});