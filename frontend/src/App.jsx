import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Settings from './pages/Settings.jsx';

// 📂 Import individual Settings & Sales modules
import CompanyDetailsForm from './components/settings/CompanyDetailsForm.jsx';
import Preferences from './components/settings/Preferences.jsx';
import Signatures from './components/settings/Signatures.jsx';
import Banks from './components/settings/Banks.jsx';
import DocumentNotesAndTerms from './components/settings/DocumentNotesAndTerms.jsx';
import BarcodeSettings from './components/settings/BarcodeSettings.jsx';
import DocumentPrefix from './components/settings/Prefix.jsx';
 
import Customers from './pages/sales/Customers.jsx';
import AddCustomer from './components/sales/AddCustomer.jsx';

import Vendors from './pages/purchase/Vendors.jsx';
import AddVendor from './components/purchase/AddVendor.jsx';
import PurchaseOrders from './pages/purchase/PurchaseOrders.jsx'; // 👈 1. Import Purchase Orders page
import AddPurchase from './components/purchase/AddPurchase.jsx';


import Products from './pages/inventory/Products.jsx';
import AddProduct from './components/inventory/AddProduct.jsx';

import Warehouses from './pages/inventory/Warehouses.jsx';
import AddWarehouse from './components/inventory/AddWarehouse.jsx';
import Stocks from './pages/inventory/Stocks.jsx';
import StockSummary from './pages/inventory/StockSummary.jsx';
import Inventories from './pages/inventory/Inventories.jsx';
import AddInventory from './components/inventory/AddInventory.jsx';

import Quotations from './pages/sales/Quotations.jsx';
import AddQuotation from './components/sales/AddQuotation.jsx';
import PublicQuotationView from './components/sales/PublicQuotationView.jsx';
import Purchases from './pages/purchase/Purchases.jsx';
 

//HR
import Departments from './pages/hr/Departments.jsx';
import AddDepartment from './components/hr/AddDepartment.jsx';
import Designations from './pages/hr/Designations.jsx';
import AddDesignation from './components/hr/AddDesignation.jsx';
import Employees from './pages/hr/Employees.jsx';
import AddEmployee from './components/hr/AddEmployee.jsx';
import EmployeeDashboard from './pages/hr/EmployeeDashboard.jsx';
import EmployeeAttendance from './pages/hr/EmployeeAttendance.jsx';
import AttendanceSheet from './pages/hr/AttendanceSheet.jsx';

//CRM
import Leads from './pages/crm/Leads.jsx';
import AddLead from './components/crm/AddLead.jsx';
import LeadView from './components/crm/ViewLead.jsx';
import CrmSettings from './pages/crm/CrmSettings.jsx';
import LeadsDashboard from './pages/crm/LeadsDashboard.jsx';


//Agents (Standalone - No Sidebar)
import AgentLogin from './pages/agent/AgentLogin.jsx';
import AgentDashboard from './pages/agent/AgentDashboard.jsx';

const App = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* 📂 STANDALONE AGENT ROUTES (Outside Layout = No Sidebar) */}
            <Route path="/agent" element={<AgentLogin />} />
            <Route path="/agent/login" element={<Navigate to="/agent" replace />} />
            <Route path="/agent/dashboard" element={<AgentDashboard />} />
            
            {/* Protected Layout Route Wrapper (Includes Sidebar & Header) */}
            <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Dashboard />} />
                
                {/* Customers Routes */}
                <Route path="/customers" element={<Customers />} />
                <Route path="/customer/add" element={<AddCustomer />} />
                <Route path="/customers/edit/:id" element={<AddCustomer />} />
                                

                // CRM Routes:
                <Route path="/crm/leads" element={<Leads />} />
                <Route path="/crm/leads/add" element={<AddLead />} />
                <Route path="/crm/leads/edit/:id" element={<AddLead />} />
                <Route path="/crm-settings" element={<CrmSettings />} />
                <Route path="/leads/view/:id" element={<LeadView />} />
                <Route path="/crm/leads-dashboard" element={<LeadsDashboard />} />

                {/* Vendors Routes */}
                <Route path="/vendors" element={<Vendors />} />
                <Route path="/vendors/add" element={<AddVendor />} />
                <Route path="/vendors/edit/:id" element={<AddVendor />} />

                {/* Purchase Orders Routes */}
                <Route path="/purchases/orders" element={<PurchaseOrders />} /> {/* 👈 2. Register Purchase Orders route */}
                <Route path="/purchase" element={<Purchases />} />
                <Route path="/purchases/add" element={<AddPurchase />} />
                <Route path="/purchases/edit/:id" element={<AddPurchase />} />

                
                {/* Products Routes */}
                <Route path="/products" element={<Products />} />
                <Route path="/products/add" element={<AddProduct />} />
                <Route path="/products/edit/:id" element={<AddProduct />} />

                {/* Warehouses Routes */}
                <Route path="/warehouses" element={<Warehouses />} />
                <Route path="/warehouses/add" element={<AddWarehouse />} />
                <Route path="/warehouses/edit/:id" element={<AddWarehouse />} />

                {/* Inventory Stock Log Routes */}
                <Route path="/inventory" element={<Inventories />} />
                <Route path="/inventory/add" element={<AddInventory />} />
                <Route path="/inventory/edit/:id" element={<AddInventory />} />
                <Route path="/stocks" element={<Stocks />} />
                <Route path="/stocks/summary" element={<StockSummary />} />

                {/* Quotation Routes */}
                <Route path="/quotations" element={<Quotations />} />
                <Route path="/quotations/add" element={<AddQuotation />} />
                <Route path="/quotations/edit/:id" element={<AddQuotation />} />
                <Route path="/quotations/view/:id" element={<PublicQuotationView />} />

                {/* HR Routes */}
                <Route path="/hr/departments" element={<Departments />} />
                <Route path="/hr/departments/add" element={<AddDepartment />} />
                <Route path="/hr/designations" element={<Designations />} />
                <Route path="/hr/designations/add" element={<AddDesignation />} />
                <Route path="/hr/employees" element={<Employees />} />
                <Route path="/hr/employees/add" element={<AddEmployee />} />
                <Route path="/hr/dashboard" element={<EmployeeDashboard />} />
                <Route path="/hr/employee-attendance" element={<EmployeeAttendance />} />
                <Route path="/hr/attendance-sheet" element={<AttendanceSheet />} />

                {/* Settings Pages / Nested Routes */}
                <Route path="/settings" element={<Settings />}>
                    <Route index element={<CompanyDetailsForm />} />
                    <Route path="company" element={<CompanyDetailsForm />} />
                    <Route path="preferences" element={<Preferences />} />
                    <Route path="signatures" element={<Signatures />} />
                    <Route path="banks" element={<Banks />} />
                    <Route path="notes-terms" element={<DocumentNotesAndTerms />} />
                    <Route path="barcode" element={<BarcodeSettings />} />
                    <Route path="prefixes" element={<DocumentPrefix />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default App;