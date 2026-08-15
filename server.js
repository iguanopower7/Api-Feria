require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const proyectosRoutes = require("./routes/proyectos");
const calificacionRoutes = require("./routes/calificacion");
const rankingRoutes = require("./routes/ranking");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/calificacion", calificacionRoutes);
app.use("/proyectos", proyectosRoutes);
app.use("/ranking", rankingRoutes);


app.get("/", async (req, res) => {
    try {
        const resultado = await db.query("SELECT NOW()");

        res.json({
            mensaje: "API FeriaJurado funcionando correctamente",
            fecha: resultado.rows[0].now
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al conectar con PostgreSQL"
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});

