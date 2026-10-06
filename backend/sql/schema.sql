-- AI Sollar Management System - Postgres schema (Neon / Local)

-- 1. Users table MUST be created first because other tables reference it
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile BIGINT NOT NULL,
    pin INT NOT NULL,
    role VARCHAR(50) NOT NULL, -- e.g., 'Admin', 'Technician', 'Staff'
    password_hash VARCHAR(255) NOT NULL,
    status INT DEFAULT 1 NOT NULL, -- 1 = Active, 0 = Inactive
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS company_details (
    id SERIAL PRIMARY KEY,
    logo_url VARCHAR(255),
    brand_name VARCHAR(150) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    gstin VARCHAR(50),
    business_type VARCHAR(50) DEFAULT 'Manufacturing',
    alt_phone VARCHAR(20),
    website VARCHAR(255),
    pan VARCHAR(50),
    fssai VARCHAR(100),
    msme_no VARCHAR(100),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255), 
    pincode VARCHAR(20), 
    city VARCHAR(100), 
    state VARCHAR(100), 
    country VARCHAR(100),
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_pincode VARCHAR(20),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_country VARCHAR(100),
    shipping_address_line1 VARCHAR(255),
    shipping_address_line2 VARCHAR(255),
    shipping_pincode VARCHAR(20),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_country VARCHAR(100),
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS company_preferences (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES company_details(id) ON DELETE CASCADE,
    tab_category VARCHAR(50) DEFAULT 'Document',
    round_off BOOLEAN DEFAULT TRUE,
    extra_discount_type VARCHAR(50) DEFAULT 'Percent',
    show_suggestions BOOLEAN DEFAULT TRUE,
    default_due_date VARCHAR(50) DEFAULT 'Same Day',
    discount_type VARCHAR(50) DEFAULT 'Total Amount',
    sort_transactions_by VARCHAR(50) DEFAULT 'Created Date',
    send_sms_to_customer BOOLEAN DEFAULT FALSE,
    mandatory_remarks_on_cancellation BOOLEAN DEFAULT FALSE,
    add_quantity_manually_on_barcode BOOLEAN DEFAULT FALSE,
    document_pdf_filename VARCHAR(255) DEFAULT 'e.g. {document_title}_{serial_number}',
    ledger_pdf_filename VARCHAR(255) DEFAULT 'e.g. {ledger_type}_Ledger_{party_name}',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS bank_accounts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES company_details(id) ON DELETE CASCADE,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100),
    branch VARCHAR(100),
    ifsc_code VARCHAR(50),
    upi_id VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    is_cash BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS document_notes_terms (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES company_details(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'Notes', -- 'Notes' or 'Terms'
    document_type VARCHAR(100) NOT NULL DEFAULT 'Invoice', -- 'Invoice', 'Estimate', etc.
    content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS barcode_settings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES company_details(id) ON DELETE CASCADE,
    package_date BOOLEAN DEFAULT TRUE,
    price_with_tax BOOLEAN DEFAULT TRUE,
    mrp_label_enabled BOOLEAN DEFAULT TRUE,
    mrp_label_text VARCHAR(100) DEFAULT 'MRP',
    mrp_font_size INTEGER DEFAULT 16,
    product_name_font_size INTEGER DEFAULT 16,
    barcode_length INTEGER DEFAULT 10,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES company_details(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    gstin VARCHAR(50),
    company_name VARCHAR(255),
    
    -- Billing Address fields
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_pincode VARCHAR(20),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_country VARCHAR(100) DEFAULT 'India',

    -- Shipping Address fields
    shipping_address_line1 VARCHAR(255),
    shipping_address_line2 VARCHAR(255),
    shipping_pincode VARCHAR(20),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_country VARCHAR(100) DEFAULT 'India',

    -- Opening Balance & Tax Options
    opening_balance NUMERIC(12, 2) DEFAULT 0.00,
    balance_type VARCHAR(20) DEFAULT 'Debit', -- 'Debit' or 'Credit'
    tds_enabled BOOLEAN DEFAULT FALSE,
    tcs_enabled BOOLEAN DEFAULT FALSE,
    rcm_applicable BOOLEAN DEFAULT FALSE,

    created_by VARCHAR(100) DEFAULT 'Raj S',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES company_details(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    gstin VARCHAR(50),
    company_name VARCHAR(255),
    
    -- Billing Address fields
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_pincode VARCHAR(20),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_country VARCHAR(100) DEFAULT 'India',

    -- Shipping Address fields
    shipping_address_line1 VARCHAR(255),
    shipping_address_line2 VARCHAR(255),
    shipping_pincode VARCHAR(20),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_country VARCHAR(100) DEFAULT 'India',

    -- Opening Balance & Tax Options
    opening_balance NUMERIC(12, 2) DEFAULT 0.00,
    balance_type VARCHAR(20) DEFAULT 'Debit', -- 'Debit' or 'Credit'
    tds_enabled BOOLEAN DEFAULT FALSE,
    tcs_enabled BOOLEAN DEFAULT FALSE,
    rcm_applicable BOOLEAN DEFAULT FALSE,

    created_by VARCHAR(100) DEFAULT 'Raj S',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES company_details(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) DEFAULT 'Product', -- 'Product' or 'Service'
    category_id  INTEGER,
    category VARCHAR(100) DEFAULT 'Finish',
    sku VARCHAR(100),
    barcode VARCHAR(100),
    hsn_sac VARCHAR(50),
    primary_unit VARCHAR(50) DEFAULT 'BOX',
    
    -- Pricing & Tax details
    selling_price NUMERIC(12, 2) DEFAULT 0.00,
    selling_price_type VARCHAR(20) DEFAULT 'with Tax', -- 'with Tax' or 'without Tax'
    tax_percentage NUMERIC(5, 2) DEFAULT 0.00,
    purchase_price NUMERIC(12, 2) DEFAULT 0.00,
    purchase_price_type VARCHAR(20) DEFAULT 'with Tax', -- 'with Tax' or 'without Tax'

    -- Inventory & Stock details
    quantity NUMERIC(12, 2) DEFAULT 0.00,
    opening_purchase_price NUMERIC(12, 2) DEFAULT 0.00,
    opening_stock_value NUMERIC(12, 2) DEFAULT 0.00,

    -- Description & Meta
    description TEXT,
    created_by VARCHAR(100) DEFAULT 'Raj S',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
id SERIAL PRIMARY KEY,
product_id INT,
image_url TEXT NOT NULL,
is_primary BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 

ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES company_details(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'Raj S',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS inventories (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES company_details(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
    transaction_type VARCHAR(20) NOT NULL, -- 'Stock In' or 'Stock Out'
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) DEFAULT 0.00,
    reference_no VARCHAR(100),
    notes TEXT,
    created_by VARCHAR(100) DEFAULT 'Raj S',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS document_prefixes (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES company_details(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- e.g., 'Invoice', 'Purchase', 'Sales Return', etc.
    entry_type VARCHAR(20) NOT NULL DEFAULT 'prefix', -- 'prefix' or 'suffix'
    prefix_value VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS document_prefixes (
    id SERIAL PRIMARY KEY,
    company_id INTEGER,
    document_type VARCHAR(100) NOT NULL, -- e.g., 'Quotation', 'Estimate'
    entry_type VARCHAR(20) NOT NULL DEFAULT 'prefix',
    prefix_value VARCHAR(100) NOT NULL, -- e.g., 'QOT-'
    is_default BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Quotations Main Table
CREATE TABLE IF NOT EXISTS quotations (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES company_details(id) ON DELETE CASCADE,
    quotation_no VARCHAR(100) NOT NULL,
    quotation_type VARCHAR(50) DEFAULT 'Regular',
    dispatch_from TEXT,
    customer_id INTEGER, -- Optional foreign key if you have a customers table
    customer_name VARCHAR(255) NOT NULL,
    billing_address TEXT,
    shipping_address TEXT,
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    validity_date DATE,
    reference_no VARCHAR(100),
    vehicle_no VARCHAR(100),
    sales_person VARCHAR(100),
    dl_no VARCHAR(100),
    subtotal NUMERIC(12, 2) DEFAULT 0.00,
    total_discount NUMERIC(12, 2) DEFAULT 0.00,
    extra_discount_type VARCHAR(10) DEFAULT '%',
    extra_discount_val NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) DEFAULT 0.00,
    round_off BOOLEAN DEFAULT TRUE,
    tcs BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'closed', 'partial', 'cancelled', 'draft'
    notes TEXT,
    terms_conditions TEXT,
    selected_bank VARCHAR(255),
    selected_signature VARCHAR(255),
    created_by VARCHAR(100) DEFAULT 'Raj S',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_desc TEXT,
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL DEFAULT 1,
    category_type VARCHAR(50) DEFAULT 'Parent Category', -- 'Parent Category' or 'Sub-Category'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    show_in_online_store BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(508),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    company_id INT DEFAULT 2,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    head_of_department VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    total_employees INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS designations (
    id SERIAL PRIMARY KEY,
    company_id INT DEFAULT 2,
    department_id INT REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 17. Employees Master Table
CREATE TABLE employees (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL, -- Combined full name
    employee_id VARCHAR(100) UNIQUE,
    date_of_joining DATE NOT NULL,
    department_id INT NOT NULL,
    designation_id INT NOT NULL,
    employment_type VARCHAR(50) NOT NULL,
    reporting_manager VARCHAR(255),
    gender VARCHAR(50) NOT NULL,
    marital_status VARCHAR(50),
    blood_group VARCHAR(20),
    employee_status VARCHAR(50) DEFAULT 'Active',
    photo VARCHAR(500), -- File path or URL
    
    -- Contact & Address Details
    email_address VARCHAR(255) NOT NULL UNIQUE,
    mobile_number VARCHAR(50) NOT NULL,
    alternate_number VARCHAR(50),
    country VARCHAR(100) DEFAULT 'India',
    additional_info VARCHAR(100),
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pin_code VARCHAR(20) NOT NULL,

    -- Salary Structure (Monthly figures)
    basic_salary NUMERIC(10, 2) DEFAULT 0.00,
    hra NUMERIC(10, 2) DEFAULT 0.00,
    conveyance NUMERIC(10, 2) DEFAULT 1600.00,
    medical NUMERIC(10, 2) DEFAULT 1250.00,
    special_allowance NUMERIC(10, 2) DEFAULT 0.00,
    gross_salary NUMERIC(10, 2) DEFAULT 0.00,
    pf NUMERIC(10, 2) DEFAULT 0.00,
    prof_tax NUMERIC(10, 2) DEFAULT 200.00,
    tds NUMERIC(10, 2) DEFAULT 0.00,
    other_deductions NUMERIC(10, 2) DEFAULT 0.00,
    total_deductions NUMERIC(10, 2) DEFAULT 0.00,
    net_salary NUMERIC(10, 2) DEFAULT 0.00,

    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (designation_id) REFERENCES designations(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Employee Qualifications Table (Supports dynamic multiple rows)
CREATE TABLE employee_qualifications (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id INT NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) DEFAULT '—',
    qualification_type VARCHAR(100) DEFAULT 'Graduation',
    institution VARCHAR(255) NOT NULL,
    passing_year VARCHAR(10),
    percentage VARCHAR(50) DEFAULT '—',
    additional_certification VARCHAR(255),
    description TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 

-- Employee Activity / Transaction Dashboard Logs Table
CREATE TABLE IF NOT EXISTS employee_activity_logs (
    id SERIAL PRIMARY KEY,
    company_id INT DEFAULT 2,
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    designation_id INT REFERENCES designations(id) ON DELETE SET NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    activity_type VARCHAR(100) NOT NULL, -- e.g., 'Performance Review', 'Attendance Audit', 'Training Assigned', 'Leave Approval'
    status VARCHAR(50) DEFAULT 'Completed', -- 'Completed', 'Pending', 'In Progress', 'Cancelled'
    performance_score NUMERIC(5, 2) DEFAULT 0.00,
    remarks TEXT,
    created_by VARCHAR(255) DEFAULT 'System Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Users Management Master Table
CREATE TABLE IF NOT EXISTS userss (
    id SERIAL PRIMARY KEY,
    company_id INT DEFAULT 2,
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    designation_id INT REFERENCES designations(id) ON DELETE SET NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Staff', -- 'Admin', 'HR Manager', 'Teacher', 'Staff', 'Accountant'
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Inactive', 'Suspended'
    password_hash VARCHAR(255),
    secure_pin VARCHAR(10),
    created_by VARCHAR(255) DEFAULT 'System Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Employee Attendance Master Table
CREATE TABLE IF NOT EXISTS employee_attendance (
    id SERIAL PRIMARY KEY,
    company_id INT DEFAULT 2,
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    designation_id INT REFERENCES designations(id) ON DELETE SET NULL,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIME,
    check_out_time TIME,
    attendance_status VARCHAR(50) NOT NULL DEFAULT 'Present', -- 'Present', 'Absent', 'Late', 'Half-Day', 'On Leave'
    remarks TEXT,
    created_by VARCHAR(255) DEFAULT 'System Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    company_id INTEGER DEFAULT 1,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    transaction_date DATE NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    insurance_type VARCHAR(100) NOT NULL, -- Product / Insurance Type
    policy_value NUMERIC(12, 2) DEFAULT 0.00,
    transaction_type VARCHAR(50) DEFAULT 'Fresh', -- Fresh, Rollover, Renewal
    deal_stage_id INTEGER REFERENCES crm_deal_stages(id) ON DELETE SET NULL, -- References Deal Stages ID
    lead_stage_id INTEGER REFERENCES crm_lead_stages(id) ON DELETE SET NULL, -- References Lead Stages ID
    status VARCHAR(50) DEFAULT 'New', -- New, Contacted, Interested, Converted, Closed
    agent_id INT REFERENCES employees(id) ON DELETE SET NULL,
    remarks TEXT,
    expiry_date DATE,
    existing_insurer VARCHAR(150),
    state VARCHAR(100),
    city VARCHAR(100),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stocks (
    id SERIAL PRIMARY KEY,
    stock_date DATE NOT NULL, 
    company_id INTEGER REFERENCES company_details(id) ON DELETE CASCADE,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    transaction_date DATE NOT NULL,     
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('Stock In', 'Stock Out', 'Issue', 'Return', 'Purchase', 'Sales')) NOT NULL,
    quantity_in NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    quantity_out NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    issue_date DATE NOT NULL,
    status VARCHAR(30) CHECK (status IN ('Active', 'Returned', 'Overdue', 'Lost', 'Completed')) DEFAULT 'Active',
    remarks TEXT,
    state VARCHAR(100),
    city VARCHAR(100),
    user_id VARCHAR(20),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Orders Header Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    company_id INTEGER DEFAULT 1,
    po_number VARCHAR(100) UNIQUE NOT NULL,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
    order_date DATE NOT NULL,
    delivery_date DATE,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Draft',
    payment_status VARCHAR(50) DEFAULT 'Pending',
    remarks TEXT,
    created_by VARCHAR(100) DEFAULT 'Admin',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Order Details (Line Items) Table
CREATE TABLE IF NOT EXISTS purchase_order_details (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    line_total NUMERIC(12, 2) NOT NULL DEFAULT 0
); 

-- 1. Purchases Header Table
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    company_id INTEGER DEFAULT 1,
    bill_number VARCHAR(100) UNIQUE NOT NULL,
    po_number VARCHAR(100),
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
    purchase_type VARCHAR(50) DEFAULT 'Regular',
    dispatch_to TEXT,
    supplier_invoice_date DATE,
    payment_date DATE,
    reference VARCHAR(255),
    supplier_invoice_serial VARCHAR(100),
    vehicle_no VARCHAR(100),
    sales_person VARCHAR(100),
    dl_no VARCHAR(100),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    pending_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, cancelled, drafts
    payment_mode VARCHAR(50) DEFAULT 'UPI',
    notes TEXT,
    terms TEXT,
    signature_name VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Purchase Details (Line Items) Table
CREATE TABLE IF NOT EXISTS purchase_details (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    line_total NUMERIC(12, 2) NOT NULL DEFAULT 0
);

-- 1. Pipelines Table
CREATE TABLE IF NOT EXISTS crm_pipelines (
    id SERIAL PRIMARY KEY,
    company_id INTEGER DEFAULT 1,
    name VARCHAR(150) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Lead Stages Table
CREATE TABLE IF NOT EXISTS crm_lead_stages (
    id SERIAL PRIMARY KEY,
    company_id INTEGER DEFAULT 1,
    pipeline_id INTEGER REFERENCES crm_pipelines(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Deal Stages Table
CREATE TABLE IF NOT EXISTS crm_deal_stages (
    id SERIAL PRIMARY KEY,
    company_id INTEGER DEFAULT 1,
    pipeline_id INTEGER REFERENCES crm_pipelines(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    display_order INTEGER DEFAULT 0,
    probability_percentage NUMERIC(5, 2) DEFAULT 0.00,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Sources Table
CREATE TABLE IF NOT EXISTS crm_sources (
    id SERIAL PRIMARY KEY,
    company_id INTEGER DEFAULT 1,
    name VARCHAR(150) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Labels Table
CREATE TABLE IF NOT EXISTS crm_labels (
    id SERIAL PRIMARY KEY,
    company_id INTEGER DEFAULT 1,
    name VARCHAR(100) NOT NULL,
    color_code VARCHAR(20) DEFAULT '#2563EB',
    display_order INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Contract Types Table
CREATE TABLE IF NOT EXISTS crm_contract_types (
    id SERIAL PRIMARY KEY,
    company_id INTEGER DEFAULT 1,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Products Table
CREATE TABLE IF NOT EXISTS crm_products (
    id SERIAL PRIMARY KEY,
    company_id INTEGER DEFAULT 1,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) DEFAULT 0.00,
    display_order INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lead_assignment_history (
    id SERIAL PRIMARY KEY,
    lead_id INT REFERENCES leads(id) ON DELETE CASCADE,
    previous_agent_id INT REFERENCES employees(id) ON DELETE SET NULL,
    new_agent_id INT REFERENCES employees(id) ON DELETE SET NULL,
    changed_by VARCHAR(150) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lead_phones (
    id SERIAL PRIMARY KEY,
    lead_id INT REFERENCES leads(id) ON DELETE CASCADE,
    phone_label VARCHAR(50) DEFAULT 'Work',
    phone_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lead_emails (
    id SERIAL PRIMARY KEY,
    lead_id INT REFERENCES leads(id) ON DELETE CASCADE,
    email_label VARCHAR(50) DEFAULT 'Work',
    email_address VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lead_discussions (
    id SERIAL PRIMARY KEY,
    lead_id INT REFERENCES leads(id) ON DELETE CASCADE,
    subject VARCHAR(250),
    discussion_text TEXT NOT NULL,
    created_by VARCHAR(150) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
