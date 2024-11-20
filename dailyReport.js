const express = require("express");
const router = express.Router();
const db = require("./db");

// Endpoint to record daily sales and update inventory
router.post("/daily-report", async (req, res) => {
  const { salesData, date } = req.body;

  let totalItemsSold = 0;
  let totalSales = 0;

  try {
    // Step 1: Insert the daily report to get the report_id
    const [dailyReportResult] = await db
      .promise()
      .query(
        "INSERT INTO daily_report (date, total_cost, total_items_sold) VALUES (?, ?, ?)",
        [date, totalSales, totalItemsSold]
      );

    const report_id = dailyReportResult.insertId; // Get the generated report_id

    // Step 2: Insert sales data with the generated report_id
    for (const sale of salesData) {
      const { inventory_id, quantity_sold, price } = sale;
      totalItemsSold += quantity_sold;
      const total_price = quantity_sold * price;
      totalSales += total_price;

      // Insert the sale record with the report_id
      await db
        .promise()
        .query(
          "INSERT INTO sales (report_id, inventory_id, quantity_sold, price, total_price) VALUES (?, ?, ?, ?, ?)",
          [report_id, inventory_id, quantity_sold, price, total_price]
        );

      // Reduce inventory stock
      await db
        .promise()
        .query(
          "UPDATE inventory SET quantity = quantity - ? WHERE inventory_id = ?",
          [quantity_sold, inventory_id]
        );
    }

    // Step 3: Update the daily report with total cost and items sold
    await db
      .promise()
      .query(
        "UPDATE daily_report SET total_cost = ?, total_items_sold = ? WHERE report_id = ?",
        [totalSales, totalItemsSold, report_id]
      );

    res.status(200).send({
      message: "Daily report created and inventory updated successfully",
    });
  } catch (error) {
    console.error("Error during daily report creation:", error);
    res.status(500).send({
      message: "Failed to record daily report",
      error: error.message,
    });
  }
});

// Endpoint to get the daily report
router.get("/daily-report/:date", async (req, res) => {
  const { date } = req.params;

  try {
    // Get summary of sales for the specified date
    const [reportData] = await db.promise().query(
      `SELECT dr.date, i.item_name, s.quantity_sold, s.total_price 
       FROM daily_report dr 
       JOIN sales s ON dr.report_id = s.report_id 
       JOIN inventory i ON s.inventory_id = i.inventory_id 
       WHERE dr.date = ?`,
      [date]
    );

    // Get total cost and items sold for the date
    const [dailyTotals] = await db
      .promise()
      .query(
        "SELECT total_cost, total_items_sold FROM daily_report WHERE date = ?",
        [date]
      );

    res.status(200).json({
      date,
      salesData: reportData,
      dailyTotals: dailyTotals[0],
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Endpoint to get the daily report by ID
router.get("/daily-report/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Get detailed sales data for the specified report ID
    const [reportData] = await db.promise().query(
      `SELECT s.sale_id AS item_id, i.item_name, s.quantity_sold, s.total_price 
       FROM sales s
       JOIN inventory i ON s.inventory_id = i.inventory_id 
       WHERE s.report_id = ?`,
      [id]
    );

    // Get the summary totals for the specified report ID
    const [dailyTotals] = await db
      .promise()
      .query(
        "SELECT date, total_cost, total_items_sold FROM daily_report WHERE report_id = ?",
        [id]
      );

    if (!dailyTotals.length) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json({
      reportId: id,
      date: dailyTotals[0].date,
      totalCost: dailyTotals[0].total_cost,
      totalItemsSold: dailyTotals[0].total_items_sold,
      itemsSold: reportData,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/daily-reports", async (req, res) => {
  try {
    // Get all daily report summaries, including report_id
    const [reports] = await db.promise().query(
      `SELECT dr.report_id, dr.date, dr.total_cost, dr.total_items_sold 
         FROM daily_report dr 
         ORDER BY dr.date DESC`
    );

    // For each report, fetch detailed items sold information
    const allReportDetails = [];

    for (const report of reports) {
      const [itemsSold] = await db.promise().query(
        `SELECT i.item_name, s.quantity_sold, s.total_price 
           FROM sales s 
           JOIN inventory i ON s.inventory_id = i.inventory_id 
           WHERE s.report_id = ?`,
        [report.report_id]
      );

      // Assign incremental item_id starting from 1 for each report
      const itemsWithCustomIds = itemsSold.map((item, index) => ({
        itemId: index + 1, // Incremental item_id starting from 1
        itemName: item.item_name,
        quantitySold: item.quantity_sold,
        totalPrice: item.total_price,
      }));

      allReportDetails.push({
        reportId: report.report_id,
        date: report.date,
        totalCost: report.total_cost,
        totalItemsSold: report.total_items_sold,
        itemsSold: itemsWithCustomIds,
      });
    }

    res.status(200).json(allReportDetails);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
