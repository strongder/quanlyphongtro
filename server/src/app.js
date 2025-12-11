const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const { globalLimiter } = require("./middlewares/rateLimit");
const { authRequired } = require("./middlewares/auth");

const app = express();

// Trust proxy for accurate IP detection behind reverse proxy/load balancer
app.set('trust proxy', 1);

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`\n[${timestamp}] ${req.method} ${req.originalUrl}`);

  // Log request body (except for sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    // Remove password from logs
    if (sanitizedBody.password) {
      sanitizedBody.password = "***";
    }
    console.log("Request Body:", JSON.stringify(sanitizedBody, null, 2));
  }

  // Log query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    console.log("Query Params:", JSON.stringify(req.query, null, 2));
  }

  // Log headers (only important ones)
  const importantHeaders = ["authorization", "content-type", "user-agent"];
  const headersToLog = {};
  importantHeaders.forEach((header) => {
    if (req.headers[header]) {
      if (header === "authorization") {
        headersToLog[header] = req.headers[header].substring(0, 20) + "...";
      } else {
        headersToLog[header] = req.headers[header];
      }
    }
  });
  if (Object.keys(headersToLog).length > 0) {
    console.log("Headers:", JSON.stringify(headersToLog, null, 2));
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - start;
    console.log(`Response Status: ${res.statusCode}`);
    console.log("Response Body:", JSON.stringify(data, null, 2));
    console.log(`Duration: ${duration}ms`);
    console.log("─".repeat(80));

    return originalJson.call(this, data);
  };

  next();
});

app.use(express.json());

// Basic health
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Swagger setup (OpenAPI spec built programmatically below)
const openapi = require("./openapi");
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));

// Apply global rate limiter
app.use("/api", globalLimiter);

// Routers
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/payments", require("./routes/payment"));
app.use("/api/vnpay", require("./routes/vnpay"));
app.use("/api/momo", require("./routes/momo"));
app.use("/api/rooms", authRequired, require("./routes/rooms"));
app.use("/api/tenants", authRequired, require("./routes/tenants"));
app.use(
  "/api/tenant-approval",
  authRequired,
  require("./routes/tenant-approval")
);
app.use("/api", authRequired, require("./routes/roomTenant"));
app.use("/api/meter-readings", authRequired, require("./routes/meterReadings"));
app.use("/api/invoices", authRequired, require("./routes/invoices"));
app.use("/api/reports", authRequired, require("./routes/reports"));
app.use("/api/settings", authRequired, require("./routes/settings"));
app.use("/api/notifications", authRequired, require("./routes/notifications"));

module.exports = app;
