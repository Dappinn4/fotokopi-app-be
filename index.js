const express = require("express");
const cors = require("cors");
const inventoryRoutes = require("./inventory");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", inventoryRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
