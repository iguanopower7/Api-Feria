const express = require("express");
const router = express.Router();
const db = require("../config/db");


router.get("/", async (req, res) => {
    try {
        const { categoria } = req.query;
        let resultado;

        if (categoria) {
            resultado = await db.query(
                "SELECT * FROM proyecto WHERE categoria = $1 ORDER BY titulo",
                [categoria]
            );
        } else {
            resultado = await db.query("SELECT * FROM proyecto ORDER BY titulo");
        }

        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al obtener los proyectos" });
    }
});


router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await db.query(
            "SELECT * FROM proyecto WHERE id_proyecto = $1",
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: "Proyecto no encontrado" });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al obtener el proyecto" });
    }
});


router.post("/", async (req, res) => {
    try {
        const { titulo, categoria } = req.body;

        if (!titulo || !categoria) {
            return res.status(400).json({ mensaje: "titulo y categoria son obligatorios" });
        }

        const resultado = await db.query(
            "INSERT INTO proyecto (titulo, categoria) VALUES ($1, $2) RETURNING *",
            [titulo, categoria]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al crear el proyecto" });
    }
});


router.get("/:id/rubrica", async (req, res) => {
    try {
        const { id } = req.params;

        const proyecto = await db.query(
            "SELECT * FROM proyecto WHERE id_proyecto = $1",
            [id]
        );

        if (proyecto.rows.length === 0) {
            return res.status(404).json({ mensaje: "Proyecto no encontrado" });
        }

        const criterios = await db.query(
            "SELECT * FROM criterio ORDER BY id_criterio"
        );

        res.json({
            proyecto: proyecto.rows[0],
            criterios: criterios.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al obtener la rubrica" });
    }
});

module.exports = router;
