// Add these two lines at the VERY TOP of server.js to catch hidden startup crashes:
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err));

// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path"; // 👈 Import path module for directory resolution

import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from './routes/dashboardRoute.js';
import insightRoutes from './routes/insightRoutes.js';

//Settings
import companyRoutes from "./routes/settings/companyRoutes.js";
import preferencesRoutes from "./routes/settings/preferencesRoutes.js";
import signatureRoutes from "./routes/settings/signatureRoutes.js";
import bankRoutes from "./routes/settings/bankRoutes.js";
import notesRoutes from "./routes/settings/notesRoutes.js";
import barcodeRoutes from "./routes/settings/barcodeRoutes.js"; // 👈 Import barcode settings routes
import prefixRoutes from './routes/settings/prefixRoutes.js';
import userRoutes from './routes/settings/userRoutes.js';

//Inventory
import productRoutes from "./routes/inventory/productRoutes.js";
import warehouseRoutes from "./routes/inventory/warehouseRoutes.js";
import inventoryRoutes from "./routes/inventory/inventoryRoutes.js";
import categoriesRoutes from './routes/inventory/categoriesRoutes.js';
import stocksRoutes from './routes/inventory/stocksRoutes.js';

//Sales & Purchases
import customerRoutes from "./routes/sales/customerRoutes.js";
import quotationRoutes from './routes/sales/quotationRoutes.js';
import vendorRoutes from "./routes/purchase/vendorRoutes.js";
import purchaseOrdersRoutes from "./routes/purchase/purchaseOrdersRoutes.js"; // 👈 1. Import Purchase Orders routes
import purchasesRoutes from "./routes/purchase/purchasesRoutes.js";


//HR
import departmentRoutes from './routes/hr/departmentRoutes.js';
import designationRoutes from './routes/hr/designationRoutes.js';
import employeeRoutes from './routes/hr/employeeRoutes.js';
import employeeDashboardRoutes from './routes/hr/employeeDashboardRoutes.js';
import attendanceRoutes from './routes/hr/attendanceRoutes.js';
import attendanceSheetRoutes from './routes/hr/attendanceSheetRoutes.js';

//Agents
import agentRoutes from './routes/agent/agentRoutes.js';
import leadsRoutes from './routes/leads/leadsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// 👈 Serve uploaded files statically so frontend <img> tags can render logos, signatures, etc.
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get("/", (req, res) => {
    res.json({ message: "AI Erp API is running" });
}); 

// Mount routes
app.use("/api/auth", authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/insights', insightRoutes);

// Register company routes and log confirmation
app.use('/api/company', companyRoutes);
console.log('✅ Mounted /api/company routes successfully');

// Settings
app.use('/api/preferences', preferencesRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/barcode-settings', barcodeRoutes);
app.use('/api/prefix', prefixRoutes);
app.use('/api/users', userRoutes);

// Sales & Purchases
app.use('/api/customers', customerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes); // 👈 2. Mount Purchase Orders routes
app.use('/api/purchases', purchasesRoutes);


//Inventory
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoriesRoutes);

//Leads
app.use('/api/leads', leadsRoutes);

//HR
app.use('/api/departments', departmentRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/employee-dashboard', employeeDashboardRoutes);
app.use('/api/employee-attendance', attendanceRoutes);
app.use('/api/attendance-sheets', attendanceSheetRoutes);

app.use('/api/quotations', quotationRoutes);

//Agents
app.use('/api/agent', agentRoutes );

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});