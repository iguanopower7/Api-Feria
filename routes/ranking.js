const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET /ranking?categoria=Robotica
// Calcula, para cada proyecto, el promedio ponderado por peso de cada
// criterio, primero por juez y luego promediando entre todos los jueces
// que hayan calificado. Los proyectos sin calificaciones no aparecen.
router.get("/", async (req, res) => {
    try {
        const { categoria } = req.query;

        const filtroCategoria = categoria ? "WHERE p.categoria = $1" : "";
        const parametros = categoria ? [categoria] : [];

        const consulta = `
            WITH puntaje_por_juez AS (
                SELECT
                    p.id_proyecto,
                    p.titulo,
                    p.categoria,
                    c.id_juez,
                    SUM(c.puntaje * cr.peso) / SUM(cr.peso) AS puntaje_ponderado
                FROM proyecto p
                JOIN calificacion c ON c.id_proyecto = p.id_proyecto
                JOIN criterio cr ON cr.id_criterio = c.id_criterio
                ${filtroCategoria}
                GROUP BY p.id_proyecto, p.titulo, p.categoria, c.id_juez
            )
            SELECT
                id_proyecto,
                titulo,
                categoria,
                ROUND(AVG(puntaje_ponderado)::numeric, 2) AS promedio_final,
                COUNT(DISTINCT id_juez) AS jueces_evaluaron
            FROM puntaje_por_juez
            GROUP BY id_proyecto, titulo, categoria
            ORDER BY promedio_final DESC;
        `;

        const resultado = await db.query(consulta, parametros);

        // Se agrega la posicion en el ranking (1ro, 2do, 3ro, ...)
        const conPosicion = resultado.rows.map((fila, indice) => ({
            posicion: indice + 1,
            ...fila
        }));

        res.json(conPosicion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al calcular el ranking" });
    }
});

module.exports = router;
