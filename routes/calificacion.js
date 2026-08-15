const express = require("express");
const router = express.Router();
const db = require("../config/db");


router.get("/criterios", async (req, res) => {
    try {
        const resultado = await db.query("SELECT * FROM criterio ORDER BY id_criterio");
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al obtener los criterios" });
    }
});


router.get("/jueces", async (req, res) => {
    try {
        const resultado = await db.query("SELECT * FROM juez ORDER BY nombre");
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al obtener los jueces" });
    }
});


router.post("/jueces", async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) {
            return res.status(400).json({ mensaje: "nombre es obligatorio" });
        }
        const resultado = await db.query(
            "INSERT INTO juez (nombre) VALUES ($1) RETURNING *",
            [nombre]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al crear el juez" });
    }
});


router.get("/:id_proyecto", async (req, res) => {
    try {
        const { id_proyecto } = req.params;
        const resultado = await db.query(
            `SELECT c.id_calificacion, c.puntaje,
                    cr.nombre AS criterio, cr.peso,
                    j.nombre AS juez
             FROM calificacion c
             JOIN criterio cr ON cr.id_criterio = c.id_criterio
             JOIN juez j ON j.id_juez = c.id_juez
             WHERE c.id_proyecto = $1
             ORDER BY j.nombre, cr.id_criterio`,
            [id_proyecto]
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al obtener las calificaciones" });
    }
});


router.post("/", async (req, res) => {
    const { id_proyecto, id_juez, calificaciones } = req.body;

    if (!id_proyecto || !id_juez || !Array.isArray(calificaciones) || calificaciones.length === 0) {
        return res.status(400).json({
            mensaje: "id_proyecto, id_juez y un arreglo de calificaciones son obligatorios"
        });
    }

    const cliente = await db.connect();
    try {
        await cliente.query("BEGIN");

        const insertados = [];
        for (const item of calificaciones) {
            const { id_criterio, puntaje } = item;

            if (id_criterio === undefined || puntaje === undefined) {
                throw new Error("Cada calificacion necesita id_criterio y puntaje");
            }

     
            const resultado = await cliente.query(
                `INSERT INTO calificacion (id_proyecto, id_criterio, id_juez, puntaje)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (id_proyecto, id_criterio, id_juez)
                 DO UPDATE SET puntaje = EXCLUDED.puntaje
                 RETURNING *`,
                [id_proyecto, id_criterio, id_juez, puntaje]
            );
            insertados.push(resultado.rows[0]);
        }

        await cliente.query("COMMIT");
        res.status(201).json({
            mensaje: "Calificacion registrada correctamente",
            calificaciones: insertados
        });
    } catch (error) {
        await cliente.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ mensaje: "Error al registrar la calificacion: " + error.message });
    } finally {
        cliente.release();
    }
});

module.exports = router;
