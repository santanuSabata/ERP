select * from company_details
select * from users order by id asc
select * from departments
select * from designations
select * from employees
select * from employee_activity_logs
select * from employee_attendance order by id
select * from products
select * from product_images
select * from leads
select * from stocks
select * from lead_assignment_history
select * from crm_products; select * from crm_lead_stages; select * from crm_deal_stages;
CREATE TABLE IF NOT EXISTS lead_discussions (
    id SERIAL PRIMARY KEY,
    lead_id INT REFERENCES leads(id) ON DELETE CASCADE,
    subject VARCHAR(250),
    discussion_text TEXT NOT NULL,
    created_by VARCHAR(150) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);