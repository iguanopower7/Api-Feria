require("dotenv").config();
const { Pool } = require("pg");

// Render Postgres requiere SSL. rejectUnauthorized:false porque Render usa
// certificados auto-firmados en el plan gratuito.
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on("error", (err) => {
    console.error("❌ Error inesperado en el pool de PostgreSQL:", err);
});

module.exports = pool;
