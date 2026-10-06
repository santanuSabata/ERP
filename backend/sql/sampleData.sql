INSERT INTO departments (company_id, name, code, description, head_of_department, status, total_employees) VALUES
(2, 'Human Resources', 'HR-001', 'Handles recruitment, employee relations, and payroll administration.', 'Aarav Sharma', 'Active', 12),
(2, 'Software Engineering', 'ENG-002', 'Responsible for product development, maintenance, and technical architecture.', 'Priya Patel', 'Active', 45),
(2, 'Finance & Accounts', 'FIN-003', 'Manages corporate finance, budgeting, taxation, and auditing.', 'Rajesh Kumar', 'Active', 8),
(2, 'Sales & Business Development', 'SAL-004', 'Drives revenue growth, client acquisition, and partnership management.', 'Sneha Gupta', 'Active', 30),
(2, 'Marketing & Communications', 'MKT-005', 'Handles brand strategy, digital marketing, campaigns, and PR.', 'Vikram Singh', 'Active', 15),
(2, 'Customer Support', 'SUP-006', 'Provides 24/7 technical and customer assistance across channels.', 'Ananya Roy', 'Active', 22),
(2, 'Quality Assurance', 'QA-007', 'Ensures software reliability, testing automation, and bug tracking.', 'Amit Joshi', 'Active', 10),
(2, 'Product Management', 'PROD-008', 'Defines product roadmaps, feature specifications, and user research.', 'Neha Verma', 'Active', 7),
(2, 'Legal & Compliance', 'LEG-009', 'Oversees corporate law, regulatory compliance, and contracts.', 'Sanjay Mehta', 'Active', 4),
(2, 'Information Technology', 'IT-010', 'Manages internal hardware, network infrastructure, and cybersecurity.', 'Karan Malhotra', 'Active', 14),
(2, 'Operations & Logistics', 'OPS-011', 'Handles supply chain coordination, inventory management, and fulfillment.', 'Ritu Sen', 'Active', 18),
(2, 'Research & Development', 'RND-012', 'Explores emerging technologies and next-generation product features.', 'Alok Bannerjee', 'Active', 9),
(2, 'Public Relations', 'PR-013', 'Maintains corporate image and media relations.', 'Pooja Nair', 'Active', 5),
(2, 'Administration', 'ADM-014', 'Manages office facilities, vendor contracts, and workplace logistics.', 'Manoj Tiwari', 'Active', 11),
(2, 'Training & Development', 'TRN-015', 'Conducts internal employee upskilling and onboarding programs.', 'Divya Ramesh', 'Active', 6),
(2, 'Data Analytics', 'DAT-016', 'Performs business intelligence, data modeling, and reporting.', 'Rohan Das', 'Active', 12),
(2, 'UI/UX Design', 'DES-017', 'Creates user interface designs, wireframes, and design systems.', 'Tanvi Shah', 'Active', 8),
(2, 'Procurement', 'PRC-018', 'Handles vendor negotiations and material purchasing.', 'Nitin Aggarwal', 'Active', 5),
(2, 'Content Strategy', 'CNT-019', 'Manages copywriting, technical documentation, and content assets.', 'Meera Iyer', 'Active', 7),
(2, 'Security & Facilities', 'SEC-020', 'Maintains physical security and premises maintenance.', 'Bikash Rout', 'Active', 10);


INSERT INTO designations (company_id, department_id, name, code, description, status) VALUES
(2, 1, 'HR Manager', 'DES-HR-01', 'Oversees HR policies, talent acquisition, and employee retention.', 'Active'),
(2, 1, 'HR Executive', 'DES-HR-02', 'Handles day-to-day HR operations and employee onboarding.', 'Active'),
(2, 2, 'Senior Software Engineer', 'DES-ENG-01', 'Designs, develops, and maintains scalable backend and frontend services.', 'Active'),
(2, 2, 'Frontend Developer', 'DES-ENG-02', 'Builds responsive web components using React and Tailwind CSS.', 'Active'),
(2, 2, 'DevOps Engineer', 'DES-ENG-03', 'Manages cloud infrastructure, CI/CD pipelines, and server deployments.', 'Active'),
(2, 3, 'Financial Controller', 'DES-FIN-01', 'Directs corporate financial planning, accounting practices, and budgets.', 'Active'),
(2, 3, 'Accountant', 'DES-FIN-02', 'Maintains general ledgers, accounts payable, and receivable records.', 'Active'),
(2, 4, 'Sales Director', 'DES-SAL-01', 'Leads global sales strategy and major client negotiations.', 'Active'),
(2, 4, 'Business Development Executive', 'DES-SAL-02', 'Identifies new market opportunities and generates outbound leads.', 'Active'),
(2, 5, 'Marketing Head', 'DES-MKT-01', 'Directs brand positioning, marketing campaigns, and market research.', 'Active'),
(2, 5, 'Digital Marketing Specialist', 'DES-MKT-02', 'Executes SEO, SEM, social media advertising, and email campaigns.', 'Active'),
(2, 6, 'Customer Support Lead', 'DES-SUP-01', 'Supervises support ticketing resolution and escalation workflows.', 'Active'),
(2, 6, 'Support Representative', 'DES-SUP-02', 'Assists clients via live chat, email, and phone support.', 'Active'),
(2, 7, 'QA Lead', 'DES-QA-01', 'Manages quality assurance test plans and automation frameworks.', 'Active'),
(2, 7, 'QA Engineer', 'DES-QA-02', 'Performs manual and automated software testing.', 'Active'),
(2, 8, 'Product Manager', 'DES-PROD-01', 'Defines product roadmaps, epics, and user stories.', 'Active'),
(2, 9, 'Legal Counsel', 'DES-LEG-01', 'Reviews contracts, compliance documents, and corporate policies.', 'Active'),
(2, 10, 'IT Administrator', 'DES-IT-01', 'Maintains internal networks, hardware setups, and IT security.', 'Active'),
(2, 11, 'Operations Manager', 'DES-OPS-01', 'Optimizes supply chain flows, facilities, and inventory systems.', 'Active'),
(2, 16, 'Data Analyst', 'DES-DAT-01', 'Builds BI dashboards, SQL queries, and predictive models.', 'Active');


INSERT INTO employees (company_id, department_id, designation_id, employee_code, first_name, last_name, email, phone, joining_date, salary, employment_type, status) VALUES
(2, 1, 1, 'EMP-1001', 'Aarav', 'Sharma', 'aarav.sharma@erp.com', '+91 9876543210', '2023-01-15', 95000.00, 'Full-time', 'Active'),
(2, 1, 2, 'EMP-1002', 'Priya', 'Patel', 'priya.patel@erp.com', '+91 9876543211', '2023-03-20', 55000.00, 'Full-time', 'Active'),
(2, 2, 3, 'EMP-1003', 'Rohan', 'Das', 'rohan.das@erp.com', '+91 9876543212', '2022-06-10', 140000.00, 'Full-time', 'Active'),
(2, 2, 4, 'EMP-1004', 'Ananya', 'Roy', 'ananya.roy@erp.com', '+91 9876543213', '2023-07-01', 85000.00, 'Full-time', 'Active'),
(2, 2, 5, 'EMP-1005', 'Vikram', 'Singh', 'vikram.singh@erp.com', '+91 9876543214', '2021-11-05', 120000.00, 'Full-time', 'Active'),
(2, 3, 6, 'EMP-1006', 'Sneha', 'Gupta', 'sneha.gupta@erp.com', '+91 9876543215', '2022-02-18', 110000.00, 'Full-time', 'Active'),
(2, 3, 7, 'EMP-1007', 'Amit', 'Joshi', 'amit.joshi@erp.com', '+91 9876543216', '2023-04-12', 60000.00, 'Full-time', 'Active'),
(2, 4, 8, 'EMP-1008', 'Rajesh', 'Kumar', 'rajesh.kumar@erp.com', '+91 9876543217', '2020-09-01', 150000.00, 'Full-time', 'Active'),
(2, 4, 9, 'EMP-1009', 'Neha', 'Verma', 'neha.verma@erp.com', '+91 9876543218', '2023-05-25', 50000.00, 'Contract', 'Active'),
(2, 5, 10, 'EMP-1010', 'Sanjay', 'Mehta', 'sanjay.mehta@erp.com', '+91 9876543219', '2022-08-14', 130000.00, 'Full-time', 'Active'),
(2, 5, 11, 'EMP-1011', 'Divya', 'Ramesh', 'divya.ramesh@erp.com', '+91 9876543220', '2023-01-10', 65000.00, 'Full-time', 'Active'),
(2, 6, 12, 'EMP-1012', 'Karan', 'Malhotra', 'karan.malhotra@erp.com', '+91 9876543221', '2021-12-01', 90000.00, 'Full-time', 'Active'),
(2, 6, 13, 'EMP-1013', 'Ritu', 'Sen', 'ritu.sen@erp.com', '+91 9876543222', '2023-06-15', 45000.00, 'Intern', 'Active'),
(2, 7, 14, 'EMP-1014', 'Alok', 'Bannerjee', 'alok.bannerjee@erp.com', '+91 9876543223', '2022-05-20', 105000.00, 'Full-time', 'Active'),
(2, 7, 15, 'EMP-1015', 'Pooja', 'Nair', 'pooja.nair@erp.com', '+91 9876543224', '2023-08-05', 70000.00, 'Full-time', 'Active'),
(2, 8, 16, 'EMP-1016', 'Manoj', 'Tiwari', 'manoj.tiwari@erp.com', '+91 9876543225', '2021-03-10', 125000.00, 'Full-time', 'Active'),
(2, 10, 18, 'EMP-1017', 'Tanvi', 'Shah', 'tanvi.shah@erp.com', '+91 9876543226', '2022-10-22', 80000.00, 'Full-time', 'Active'),
(2, 11, 19, 'EMP-1018', 'Nitin', 'Aggarwal', 'nitin.aggarwal@erp.com', '+91 9876543227', '2020-07-15', 115000.00, 'Full-time', 'Active'),
(2, 16, 20, 'EMP-1019', 'Meera', 'Iyer', 'meera.iyer@erp.com', '+91 9876543228', '2023-02-28', 95000.00, 'Full-time', 'Active'),
(2, 14, 18, 'EMP-1020', 'Bikash', 'Rout', 'bikash.rout@erp.com', '+91 9876543229', '2022-09-09', 50000.00, 'Contract', 'Active');

INSERT INTO employees (
    first_name, last_name, name, employee_id, date_of_joining, department_id, designation_id, 
    employment_type, reporting_manager, gender, marital_status, blood_group, employee_status, 
    email_address, mobile_number, address_line_1, city, state, pin_code, 
    basic_salary, hra, conveyance, medical, special_allowance, gross_salary, 
    pf, prof_tax, tds, other_deductions, total_deductions, net_salary
) VALUES 
('Aarav', 'Sharma', 'Aarav Sharma', 'EMP-2026-001', '2023-01-15', 1, 1, 'Full-Time', 'Rajesh Kumar', 'Male', 'Married', 'B+', 'Active', 'aarav.sharma@school.edu', '9876543210', '12th Cross Street', 'Jaipur', 'Rajasthan', '302001', 45000.00, 18000.00, 1600.00, 1250.00, 5000.00, 70850.00, 5400.00, 200.00, 1500.00, 0.00, 7100.00, 63750.00),
('Priya', 'Patel', 'Priya Patel', 'EMP-2026-002', '2023-03-20', 1, 2, 'Full-Time', 'Aarav Sharma', 'Female', 'Single', 'O+', 'Active', 'priya.patel@school.edu', '9876543211', '45 Park Avenue', 'Jaipur', 'Rajasthan', '302015', 35000.00, 14000.00, 1600.00, 1250.00, 3000.00, 54850.00, 4200.00, 200.00, 500.00, 0.00, 4900.00, 49950.00),
('Rohan', 'Das', 'Rohan Das', 'EMP-2026-003', '2022-06-10', 2, 3, 'Full-Time', 'Vikram Singh', 'Male', 'Married', 'A+', 'Active', 'rohan.das@school.edu', '9876543212', '78 Sector 4', 'Jaipur', 'Rajasthan', '302020', 55000.00, 22000.00, 1600.00, 1250.00, 8000.00, 87850.00, 6600.00, 200.00, 2500.00, 0.00, 9300.00, 78550.00),
('Ananya', 'Roy', 'Ananya Roy', 'EMP-2026-004', '2023-07-01', 2, 4, 'Full-Time', 'Rohan Das', 'Female', 'Single', 'AB+', 'Active', 'ananya.roy@school.edu', '9876543213', '99 Malviya Nagar', 'Jaipur', 'Rajasthan', '302017', 40000.00, 16000.00, 1600.00, 1250.00, 4000.00, 62850.00, 4800.00, 200.00, 1000.00, 0.00, 6000.00, 56850.00),
('Vikram', 'Singh', 'Vikram Singh', 'EMP-2026-005', '2021-11-05', 3, 5, 'Full-Time', 'Principal', 'Male', 'Married', 'B-', 'Active', 'vikram.singh@school.edu', '9876543214', '14 C-Scheme', 'Jaipur', 'Rajasthan', '302005', 65000.00, 26000.00, 1600.00, 1250.00, 10000.00, 103850.00, 7800.00, 200.00, 4000.00, 500.00, 12500.00, 91350.00),
('Sneha', 'Gupta', 'Sneha Gupta', 'EMP-2026-006', '2022-02-18', 3, 6, 'Full-Time', 'Vikram Singh', 'Female', 'Married', 'O-', 'Active', 'sneha.gupta@school.edu', '9876543215', '32 Gopalpura Bypass', 'Jaipur', 'Rajasthan', '302018', 48000.00, 19200.00, 1600.00, 1250.00, 5000.00, 75050.00, 5760.00, 200.00, 1500.00, 0.00, 7460.00, 67590.00),
('Amit', 'Joshi', 'Amit Joshi', 'EMP-2026-007', '2023-04-12', 4, 7, 'Full-Time', 'Rajesh Kumar', 'Male', 'Single', 'A-', 'Active', 'amit.joshi@school.edu', '9876543216', '56 Vaishali Nagar', 'Jaipur', 'Rajasthan', '302021', 30000.00, 12000.00, 1600.00, 1250.00, 2000.00, 46850.00, 3600.00, 200.00, 200.00, 0.00, 4000.00, 42850.00),
('Rajesh', 'Kumar', 'Rajesh Kumar', 'EMP-2026-008', '2020-09-01', 4, 8, 'Full-Time', 'Director', 'Male', 'Married', 'AB-', 'Active', 'rajesh.kumar@school.edu', '9876543217', '88 Tonk Road', 'Jaipur', 'Rajasthan', '302015', 75000.00, 30000.00, 1600.00, 1250.00, 12000.00, 119850.00, 9000.00, 200.00, 6000.00, 1000.00, 16200.00, 103650.00),
('Neha', 'Verma', 'Neha Verma', 'EMP-2026-009', '2023-05-25', 5, 9, 'Contract', 'Sneha Gupta', 'Female', 'Single', 'B+', 'Active', 'neha.verma@school.edu', '9876543218', '11 Mansarovar', 'Jaipur', 'Rajasthan', '302020', 28000.00, 11200.00, 1600.00, 1250.00, 1500.00, 43550.00, 3360.00, 200.00, 0.00, 0.00, 3560.00, 39990.00),
('Sanjay', 'Mehta', 'Sanjay Mehta', 'EMP-2026-010', '2022-08-14', 5, 10, 'Full-Time', 'Rajesh Kumar', 'Male', 'Married', 'O+', 'Active', 'sanjay.mehta@school.edu', '9876543219', '23 Raja Park', 'Jaipur', 'Rajasthan', '302004', 60000.00, 24000.00, 1600.00, 1250.00, 7000.00, 93850.00, 7200.00, 200.00, 3000.00, 0.00, 10400.00, 83450.00),
('Divya', 'Ramesh', 'Divya Ramesh', 'EMP-2026-011', '2023-01-10', 1, 2, 'Full-Time', 'Aarav Sharma', 'Female', 'Single', 'A+', 'Active', 'divya.ramesh@school.edu', '9876543220', '67 Jagatpura', 'Jaipur', 'Rajasthan', '302017', 36000.00, 14400.00, 1600.00, 1250.00, 3000.00, 56250.00, 4320.00, 200.00, 500.00, 0.00, 5020.00, 51230.00),
('Karan', 'Malhotra', 'Karan Malhotra', 'EMP-2026-012', '2021-12-01', 2, 3, 'Full-Time', 'Rohan Das', 'Male', 'Married', 'B+', 'Active', 'karan.malhotra@school.edu', '9876543221', '19 Ajmer Road', 'Jaipur', 'Rajasthan', '302006', 52000.00, 20800.00, 1600.00, 1250.00, 6000.00, 81650.00, 6240.00, 200.00, 2000.00, 0.00, 8440.00, 73210.00),
('Ritu', 'Sen', 'Ritu Sen', 'EMP-2026-013', '2023-06-15', 3, 6, 'Intern', 'Vikram Singh', 'Female', 'Single', 'O+', 'Active', 'ritu.sen@school.edu', '9876543222', '44 Sitapura', 'Jaipur', 'Rajasthan', '302022', 20000.00, 8000.00, 1600.00, 1250.00, 1000.00, 31850.00, 2400.00, 200.00, 0.00, 0.00, 2600.00, 29250.00),
('Alok', 'Bannerjee', 'Alok Bannerjee', 'EMP-2026-014', '2022-05-20', 4, 7, 'Full-Time', 'Rajesh Kumar', 'Male', 'Married', 'AB+', 'Active', 'alok.bannerjee@school.edu', '9876543223', '90 Jhotwara', 'Jaipur', 'Rajasthan', '302012', 42000.00, 16800.00, 1600.00, 1250.00, 4000.00, 65650.00, 5040.00, 200.00, 1000.00, 0.00, 6240.00, 59410.00),
('Pooja', 'Nair', 'Pooja Nair', 'EMP-2026-015', '2023-08-05', 5, 9, 'Full-Time', 'Sanjay Mehta', 'Female', 'Single', 'B-', 'Active', 'pooja.nair@school.edu', '9876543224', '15 Bapu Nagar', 'Jaipur', 'Rajasthan', '302015', 38000.00, 15200.00, 1600.00, 1250.00, 3500.00, 59550.00, 4560.00, 200.00, 800.00, 0.00, 5560.00, 53990.00),
('Manoj', 'Tiwari', 'Manoj Tiwari', 'EMP-2026-016', '2021-03-10', 1, 1, 'Full-Time', 'Director', 'Male', 'Married', 'O-', 'Active', 'manoj.tiwari@school.edu', '9876543225', '73 Nirman Nagar', 'Jaipur', 'Rajasthan', '302019', 70000.00, 28000.00, 1600.00, 1250.00, 10000.00, 110850.00, 8400.00, 200.00, 5000.00, 0.00, 13600.00, 97250.00),
('Tanvi', 'Shah', 'Tanvi Shah', 'EMP-2026-017', '2022-10-22', 2, 4, 'Full-Time', 'Rohan Das', 'Female', 'Married', 'A+', 'Active', 'tanvi.shah@school.edu', '9876543226', '27 Shyam Nagar', 'Jaipur', 'Rajasthan', '302019', 46000.00, 18400.00, 1600.00, 1250.00, 4500.00, 70650.00, 5520.00, 200.00, 1200.00, 0.00, 6920.00, 63730.00),
('Nitin', 'Aggarwal', 'Nitin Aggarwal', 'EMP-2026-018', '2020-07-15', 3, 5, 'Full-Time', 'Vikram Singh', 'Male', 'Married', 'B+', 'Active', 'nitin.aggarwal@school.edu', '9876543227', '82 Civil Lines', 'Jaipur', 'Rajasthan', '302006', 68000.00, 27200.00, 1600.00, 1250.00, 9000.00, 107050.00, 8160.00, 200.00, 4500.00, 500.00, 13360.00, 93690.00),
('Meera', 'Iyer', 'Meera Iyer', 'EMP-2026-019', '2023-02-28', 4, 7, 'Full-Time', 'Rajesh Kumar', 'Female', 'Single', 'AB+', 'Active', 'meera.iyer@school.edu', '9876543228', '39 Tilak Nagar', 'Jaipur', 'Rajasthan', '302004', 34000.00, 13600.00, 1600.00, 1250.00, 2500.00, 52950.00, 4080.00, 200.00, 400.00, 0.00, 4680.00, 48270.00),
('Bikash', 'Rout', 'Bikash Rout', 'EMP-2026-020', '2022-09-09', 5, 10, 'Contract', 'Sanjay Mehta', 'Male', 'Married', 'O+', 'Active', 'bikash.rout@school.edu', '9876543229', '64 Mansarovar Ext', 'Jaipur', 'Rajasthan', '302020', 32000.00, 12800.00, 1600.00, 1250.00, 2000.00, 49650.00, 3840.00, 200.00, 300.00, 0.00, 4340.00, 45310.00);

-- Insert 20 Realistic Sample Records
INSERT INTO employee_activity_logs (company_id, employee_id, department_id, designation_id, transaction_date, activity_type, status, performance_score, remarks, created_by) VALUES
(2, 1, 1, 1, '2026-06-01', 'Performance Review', 'Completed', 92.50, 'Exceeded quarterly leadership and recruitment KPIs.', 'HR Director'),
(2, 2, 1, 2, '2026-06-02', 'Training Assigned', 'In Progress', 85.00, 'Enrolled in advanced HR compliance certification.', 'Aarav Sharma'),
(2, 3, 2, 3, '2026-06-03', 'Code Quality Audit', 'Completed', 95.00, 'Successfully optimized microservices architecture latency.', 'Tech Lead'),
(2, 4, 2, 4, '2026-06-04', 'Performance Review', 'Completed', 88.00, 'Delivered React student portal modules ahead of schedule.', 'Rohan Das'),
(2, 5, 3, 5, '2026-06-05', 'Security Assessment', 'Completed', 90.00, 'Passed annual cloud infrastructure penetration testing.', 'CTO'),
(2, 6, 3, 6, '2026-06-06', 'Budget Audit', 'Completed', 94.00, 'Clean financial audit for Q2 software licensing.', 'Financial Controller'),
(2, 7, 4, 7, '2026-06-07', 'Tax Filing Review', 'Pending', 78.50, 'Awaiting final verification of GST input tax credits.', 'Sneha Gupta'),
(2, 8, 4, 8, '2026-06-08', 'Sales Milestone', 'Completed', 98.00, 'Secured enterprise SaaS contract with regional school board.', 'Director'),
(2, 9, 5, 9, '2026-06-09', 'Campaign Analysis', 'In Progress', 82.00, 'Analyzing digital ad conversions for admissions campaign.', 'Marketing Head'),
(2, 10, 5, 10, '2026-06-10', 'PR Strategy Meeting', 'Completed', 89.00, 'Finalized press release for ERP version 3 launch.', 'Rajesh Kumar'),
(2, 11, 1, 2, '2026-06-11', 'Onboarding Audit', 'Completed', 91.00, 'Successfully onboarded 15 new faculty staff members.', 'Aarav Sharma'),
(2, 12, 2, 3, '2026-06-12', 'Architecture Review', 'Completed', 96.00, 'Approved database sharding strategy for high load.', 'Rohan Das'),
(2, 13, 3, 6, '2026-06-13', 'Internship Evaluation', 'Completed', 84.00, 'Completed foundational finance training module.', 'Vikram Singh'),
(2, 14, 4, 7, '2026-06-14', 'Client Pitch', 'Completed', 87.00, 'Demonstrated product features to prospective institutional client.', 'Rajesh Kumar'),
(2, 15, 5, 9, '2026-06-15', 'Social Media Campaign', 'In Progress', 80.00, 'Monitoring engagement metrics across LinkedIn and Twitter.', 'Sanjay Mehta'),
(2, 16, 1, 1, '2026-06-16', 'Policy Revision', 'Completed', 93.00, 'Updated employee handbook with remote work guidelines.', 'Director'),
(2, 17, 2, 4, '2026-06-17', 'UI/UX Redesign Sprint', 'Completed', 94.50, 'Delivered Figma design system for mobile responsive views.', 'Rohan Das'),
(2, 18, 3, 5, '2026-06-18', 'Cloud Migration', 'Completed', 97.00, 'Migrated legacy storage buckets to AWS S3 securely.', 'Vikram Singh'),
(2, 19, 4, 7, '2026-06-19', 'Market Research', 'Completed', 86.00, 'Compiled competitor pricing matrix for Q3 review.', 'Rajesh Kumar'),
(2, 20, 5, 10, '2026-06-20', 'Facility Inspection', 'Completed', 90.00, 'Completed quarterly workplace safety and compliance check.', 'Sanjay Mehta');


-- Truncate or insert sample data safely
INSERT INTO userss (company_id, employee_id, department_id, designation_id, username, full_name, email, mobile, role, status, password_hash, secure_pin, created_by) VALUES
(2, 1, 1, 1, 'aarav.sharma', 'Aarav Sharma', 'aarav.sharma@school.edu', '9876543210', 'Admin', 'Active', 'hashed_pass_123', '1234', 'Super Admin'),
(2, 2, 1, 2, 'priya.patel', 'Priya Patel', 'priya.patel@school.edu', '9876543211', 'HR Manager', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 3, 2, 3, 'rohan.das', 'Rohan Das', 'rohan.das@school.edu', '9876543212', 'Staff', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 4, 2, 4, 'ananya.roy', 'Ananya Roy', 'ananya.roy@school.edu', '9876543213', 'Staff', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 5, 3, 5, 'vikram.singh', 'Vikram Singh', 'vikram.singh@school.edu', '9876543214', 'Accountant', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 6, 3, 6, 'sneha.gupta', 'Sneha Gupta', 'sneha.gupta@school.edu', '9876543215', 'Staff', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 7, 4, 7, 'amit.joshi', 'Amit Joshi', 'amit.joshi@school.edu', '9876543216', 'Staff', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 8, 4, 8, 'rajesh.kumar', 'Rajesh Kumar', 'rajesh.kumar@school.edu', '9876543217', 'HR Manager', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 9, 5, 9, 'neha.verma', 'Neha Verma', 'neha.verma@school.edu', '9876543218', 'Staff', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 10, 5, 10, 'sanjay.mehta', 'Sanjay Mehta', 'sanjay.mehta@school.edu', '9876543219', 'Staff', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 11, 1, 2, 'divya.ramesh', 'Divya Ramesh', 'divya.ramesh@school.edu', '9876543220', 'Staff', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 12, 2, 3, 'karan.malhotra', 'Karan Malhotra', 'karan.malhotra@school.edu', '9876543221', 'Staff', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 13, 3, 6, 'ritu.sen', 'Ritu Sen', 'ritu.sen@school.edu', '9876543222', 'Staff', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 14, 4, 7, 'alok.bannerjee', 'Alok Bannerjee', 'alok.bannerjee@school.edu', '9876543223', 'Staff', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 15, 5, 9, 'pooja.nair', 'Pooja Nair', 'pooja.nair@school.edu', '9876543224', 'Staff', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 16, 1, 1, 'manoj.tiwari', 'Manoj Tiwari', 'manoj.tiwari@school.edu', '9876543225', 'Admin', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 17, 2, 4, 'tanvi.shah', 'Tanvi Shah', 'tanvi.shah@school.edu', '9876543226', 'Staff', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 18, 3, 5, 'nitin.aggarwal', 'Nitin Aggarwal', 'nitin.aggarwal@school.edu', '9876543227', 'Accountant', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 19, 4, 7, 'meera.iyer', 'Meera Iyer', 'meera.iyer@school.edu', '9876543228', 'Staff', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma'),
(2, 20, 5, 10, 'bikash.rout', 'Bikash Rout', 'bikash.rout@school.edu', '9876543229', 'Staff', 'Active', 'hashed_pass_123', '1234', 'Aarav Sharma')
ON CONFLICT (username) DO NOTHING;


-- 20 Realistic Sample Records for Corporate Insurance Leads
INSERT INTO leads (transaction_id, transaction_date, company_name, contact_person, email, phone, insurance_type, policy_value, transaction_type, status, created_by) VALUES
('TXN-2026-001', '2026-03-01', 'Apex Logistics Corp', 'Rajesh Sharma', 'rajesh@apexlogistics.com', '9898815579', 'Group Health Insurance', 450000.00, 'New Policy', 'New', 'Admin'),
('TXN-2026-002', '2026-03-02', 'Vanguard Fintech Ltd', 'Priya Patel', 'priya@vanguardfin.io', '9876543211', 'Cyber Security Insurance', 850000.00, 'New Policy', 'Contacted', 'Admin'),
('TXN-2026-003', '2026-03-03', 'Zenith Manufacturing', 'Amit Verma', 'amit@zenithmfg.com', '9876543212', 'Commercial Liability', 320000.00, 'Renewal', 'Interested', 'Admin'),
('TXN-2026-004', '2026-03-04', 'BlueSky Retailers', 'Neha Gupta', 'neha@blueskyretail.in', '9876543213', 'Workmens Compensation', 150000.00, 'New Policy', 'New', 'Admin'),
('TXN-2026-005', '2026-03-05', 'CloudScale Technologies', 'Vikram Malhotra', 'vikram@cloudscale.tech', '9876543214', 'Directors & Officers Liability', 1200000.00, 'New Policy', 'Converted', 'Admin'),
('TXN-2026-006', '2026-03-06', 'Delta Agro Exports', 'Suresh Reddy', 'suresh@deltaagro.com', '9876543215', 'Marine Cargo Insurance', 600000.00, 'Renewal', 'Contacted', 'Admin'),
('TXN-2026-007', '2026-03-07', 'Echo Mediaworks', 'Ananya Sen', 'ananya@echomedia.in', '9876543216', 'Group Health Insurance', 280000.00, 'New Policy', 'New', 'Admin'),
('TXN-2026-008', '2026-03-08', 'Sigma Pharma Solutions', 'Dr. R. K. Rao', 'rkrao@sigmapharma.com', '9876543217', 'Product Liability Insurance', 950000.00, 'Endorsement', 'Interested', 'Admin'),
('TXN-2026-009', '2026-03-09', 'Titan Infrastructure', 'Manish Kumar', 'manish@titaninfra.com', '9876543218', 'Contractors All Risk', 2500000.00, 'New Policy', 'Converted', 'Admin'),
('TXN-2026-010', '2026-03-10', 'Nova Hotels & Resorts', 'Sunita Rao', 'sunita@novahotels.com', '9876543219', 'Property & Fire Insurance', 1800000.00, 'Renewal', 'New', 'Admin'),
('TXN-2026-011', '2026-03-11', 'Quantum Logistics', 'Karan Johar', 'karan@quantumlog.com', '9876543220', 'Marine Cargo Insurance', 700000.00, 'New Policy', 'Contacted', 'Admin'),
('TXN-2026-012', '2026-03-12', 'Apex Pharma Labs', 'Meera Nair', 'meera@apexlabs.in', '9876543221', 'Product Liability Insurance', 500000.00, 'New Policy', 'New', 'Admin'),
('TXN-2026-013', '2026-03-13', 'Stellar Software', 'Arjun Kapoor', 'arjun@stellarsoft.io', '9876543222', 'Cyber Security Insurance', 900000.00, 'Renewal', 'Interested', 'Admin'),
('TXN-2026-014', '2026-03-14', 'GreenField Energy', 'Rohan Mehta', 'rohan@greenfield.org', '9876543223', 'Commercial Liability', 1100000.00, 'New Policy', 'Converted', 'Admin'),
('TXN-2026-015', '2026-03-15', 'Omega Foods Pvt Ltd', 'Divya Suresh', 'divya@omegafoods.com', '9876543224', 'Workmens Compensation', 300000.00, 'Renewal', 'New', 'Admin'),
('TXN-2026-016', '2026-03-16', 'Pioneer Auto Parts', 'Vikas Khanna', 'vikas@pioneerauto.in', '9876543225', 'Property & Fire Insurance', 1400000.00, 'Endorsement', 'Contacted', 'Admin'),
('TXN-2026-017', '2026-03-17', 'Summit Telecom', 'Natasha Roy', 'natasha@summitel.com', '9876543226', 'Directors & Officers Liability', 1600000.00, 'New Policy', 'Interested', 'Admin'),
('TXN-2026-018', '2026-03-18', 'Vertex Architects', 'Sameer Joshi', 'sameer@vertexarch.com', '9876543227', 'Professional Indemnity', 400000.00, 'New Policy', 'New', 'Admin'),
('TXN-2026-019', '2026-03-19', 'Horizon Exports', 'Kavita Iyer', 'kavita@horizonexp.com', '9876543228', 'Marine Cargo Insurance', 820000.00, 'Renewal', 'Converted', 'Admin'),
('TXN-2026-020', '2026-03-20', 'Nexus Global Services', 'Deepak Chopra', 'deepak@nexusglobal.com', '9876543229', 'Group Health Insurance', 750000.00, 'New Policy', 'New', 'Admin');



CREATE TABLE IF NOT EXISTS stocks (
    id SERIAL PRIMARY KEY,
    stock_date DATE NOT NULL, 
    company_id INTEGER REFERENCES company_details(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    transaction_date DATE NOT NULL,     
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('Stock In', 'Stock Out', 'Issue', 'Return', 'Purchase', 'Sales')) NOT NULL,
    quantity_in NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    quantity_out NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    issue_date DATE NOT NULL,
    status VARCHAR(30) CHECK (status IN ('Active', 'Returned', 'Overdue', 'Lost', 'Completed')) DEFAULT 'Active',
    remarks TEXT,
    user_id VARCHAR(20),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert 20 realistic corporate insurance / stock movement sample records
INSERT INTO stocks (stock_date, company_id, product_id, transaction_id, transaction_date, transaction_type, quantity_in, quantity_out, issue_date, status, remarks, user_id) VALUES
('2026-08-01', 1, NULL, 'TXN-9001', '2026-08-01', 'Stock Out', 0.00, 50.00, '2026-08-01', 'Overdue', 'Corporate policy kits allocated to Agent Aarav (AGT-101)', 'USR-01'),
('2026-08-03', 1, NULL, 'TXN-9002', '2026-08-03', 'Stock In', 100.00, 0.00, '2026-07-01', 'Returned', 'Restocked central underwriting manuals from supplier', 'USR-01'),
('2026-08-05', 1, NULL, 'TXN-9003', '2026-08-05', 'Stock Out', 0.00, 25.00, '2026-08-05', 'Active', 'Health insurance claim handbooks for Rohan (AGT-103)', 'USR-02'),
('2026-08-10', 1, NULL, 'TXN-9004', '2026-08-10', 'Stock Out', 0.00, 10.00, '2026-08-10', 'Active', 'Property loss assessment guides for Ananya (AGT-104)', 'USR-01'),
('2026-08-12', 1, NULL, 'TXN-9005', '2026-08-12', 'Stock In', 30.00, 0.00, '2026-07-10', 'Returned', 'Actuarial reference notes returned by Kabir (AGT-105)', 'USR-03'),
('2026-08-15', 1, NULL, 'TXN-9006', '2026-08-15', 'Stock Out', 0.00, 15.00, '2026-08-15', 'Active', 'Motor claims quick references for Meera (AGT-106)', 'USR-02'),
('2026-08-18', 1, NULL, 'TXN-9007', '2026-08-18', 'Stock Out', 0.00, 20.00, '2026-08-18', 'Active', 'Commercial liability binders for Vihaan (AGT-107)', 'USR-01'),
('2026-08-20', 1, NULL, 'TXN-9008', '2026-08-20', 'Stock In', 40.00, 0.00, '2026-07-20', 'Returned', 'Group health operation guides restocked', 'USR-01'),
('2026-08-22', 1, NULL, 'TXN-9009', '2026-08-22', 'Stock Out', 0.00, 12.00, '2026-08-22', 'Active', 'Corporate governance standards for Arjun (AGT-109)', 'USR-02'),
('2026-08-25', 1, NULL, 'TXN-9010', '2026-08-25', 'Stock Out', 0.00, 18.00, '2026-08-25', 'Active', 'Annuity & pension schematics for Sneha (AGT-110)', 'USR-03'),
('2026-08-28', 1, NULL, 'TXN-9011', '2026-08-28', 'Stock In', 22.00, 0.00, '2026-07-25', 'Returned', 'Reinsurance contract handbooks returned', 'USR-01'),
('2026-09-01', 1, NULL, 'TXN-9012', '2026-09-01', 'Stock Out', 0.00, 35.00, '2026-09-01', 'Active', 'Taxation laws for insurance allocated to Tanvi (AGT-112)', 'USR-01'),
('2026-09-02', 1, NULL, 'TXN-9013', '2026-09-02', 'Stock Out', 0.00, 30.00, '2026-09-02', 'Active', 'Wellness program frameworks for Karan (AGT-113)', 'USR-02'),
('2026-09-04', 1, NULL, 'TXN-9014', '2026-09-04', 'Stock In', 50.00, 0.00, '2026-08-04', 'Returned', 'Auditing & compliance manuals returned by Nisha', 'USR-03'),
('2026-09-06', 1, NULL, 'TXN-9015', '2026-09-06', 'Stock Out', 0.00, 14.00, '2026-09-06', 'Active', 'Global risk assessment kits for Devendra (AGT-115)', 'USR-01'),
('2026-09-08', 1, NULL, 'TXN-9016', '2026-09-08', 'Stock Out', 0.00, 16.00, '2026-09-08', 'Active', 'Fleet insurance guidelines for Swati (AGT-116)', 'USR-02'),
('2026-09-10', 1, NULL, 'TXN-9017', '2026-09-10', 'Stock In', 25.00, 0.00, '2026-08-10', 'Returned', 'Actuarial tables vol 2 returned', 'USR-01'),
('2026-09-12', 1, NULL, 'TXN-9018', '2026-09-12', 'Stock Out', 0.00, 19.00, '2026-09-12', 'Active', 'Insurance analytics guides for Divya (AGT-118)', 'USR-03'),
('2026-09-15', 1, NULL, 'TXN-9019', '2026-09-15', 'Stock Out', 0.00, 21.00, '2026-09-15', 'Active', 'Catastrophe modeling guides for Rahul (AGT-119)', 'USR-02'),
('2026-09-18', 1, NULL, 'TXN-9020', '2026-09-18', 'Stock Out', 0.00, 28.00, '2026-09-18', 'Active', 'Marine & cargo insurance primers for Puja (AGT-120)', 'USR-01');


-- Sample Seed Data for Initial Testing
INSERT INTO crm_pipelines (company_id, name, is_default, display_order) VALUES (1, 'Sales', TRUE, 1);
INSERT INTO crm_lead_stages (company_id, pipeline_id, name, display_order) VALUES (1, 1, 'New Lead', 1), (1, 1, 'Contacted', 2);
INSERT INTO crm_deal_stages (company_id, pipeline_id, name, display_order, probability_percentage) VALUES (1, 1, 'Qualified', 1, 20.00), (1, 1, 'Proposal Sent', 2, 50.00);
INSERT INTO crm_sources (company_id, name, display_order) VALUES (1, 'Website Form', 1), (1, 'Direct Call', 2), (1, 'Referral', 3);
INSERT INTO crm_labels (company_id, name, color_code, display_order) VALUES (1, 'High Priority', '#E53935', 1), (1, 'Enterprise', '#2563EB', 2);
INSERT INTO crm_contract_types (company_id, name, display_order) VALUES (1, 'Service Level Agreement (SLA)', 1), (1, 'Annual Maintenance Contract (AMC)', 2);
INSERT INTO crm_products (company_id, name, price, display_order) VALUES (1, 'Enterprise Cloud ERP License', 150000.00, 1), (1, 'Manufacturing Module Add-on', 45000.00, 2);