const express = require("express");
const cors = require("cors");
const inventoryRoutes = require("./inventory");
const dailyReportRoutes = require("./dailyReport");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", inventoryRoutes);
app.use("/api", dailyReportRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
