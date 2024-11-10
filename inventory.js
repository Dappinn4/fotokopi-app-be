const express = require("express");
const router = express.Router();
const db = require("./db");

// Get all inventory items
router.get("/inventory", (req, res) => {
  db.query("SELECT * FROM inventory", (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});

// Get a specific inventory item
router.get("/inventory/:id", (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT * FROM inventory WHERE inventory_id = ?",
    [id],
    (err, results) => {
      if (err) {
        res.status(500).send(err);
      } else if (results.length === 0) {
        res.status(404).send("Item not found");
      } else {
        res.json(results[0]);
      }
    }
  );
});

// Add a new inventory item
router.post("/inventory", (req, res) => {
  const { item_name, quantity, unit_price } = req.body;
  const query =
    "INSERT INTO inventory (item_name, quantity, unit_price) VALUES (?, ?, ?)";
  db.query(query, [item_name, quantity, unit_price], (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ id: results.insertId, item_name, quantity, unit_price });
    }
  });
});

// Update an inventory item
router.put("/inventory/:id", (req, res) => {
  const { id } = req.params;
  const { item_name, quantity, unit_price } = req.body;
  const query =
    "UPDATE inventory SET item_name = ?, quantity = ?, unit_price = ? WHERE inventory_id = ?";
  db.query(query, [item_name, quantity, unit_price, id], (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send("Item updated successfully");
    }
  });
});

// Delete an inventory item
router.delete("/inventory/:id", (req, res) => {
  const { id } = req.params;
  db.query(
    "DELETE FROM inventory WHERE inventory_id = ?",
    [id],
    (err, results) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send("Item deleted successfully");
      }
    }
  );
});

module.exports = router;
