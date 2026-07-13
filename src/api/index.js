// ============================================================
// ByteLens — API Route Aggregator
// Mounts all Express route modules under /api
// ============================================================

const express = require('express');
const router = express.Router();

const invoiceRoutes = require('./invoice.routes');
const webhookRoutes = require('./webhook.routes');

// Mount routes
router.use(invoiceRoutes);   // POST /api/discord/create-invoice
router.use(webhookRoutes);   // POST /api/payment-notification

module.exports = router;
