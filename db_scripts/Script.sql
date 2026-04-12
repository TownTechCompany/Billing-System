-- Insert Default Customer: Riyas Khan
-- Email: m.driyaskhan55@gmail.com
-- Type: Owner
-- Password: owner123

INSERT INTO customer (first_name, last_name, email, customer_type, password, is_active, created_at, created_on, updated_at, updated_on)
VALUES (
    'Riyas',
    'Khan',
    'm.driyaskhan55@gmail.com',
    'Owner',
    'gAAAAABpabjB61lDpDFpeEGgFCoSwaTpEEDSwMXgiSK9ND3kARvKBbhkm4hEGG9KJBuBprBTL-mnzEyAmfkkYTpg13gYMyZdrw==',
    1,
    datetime('now'),
    datetime('now'),
    datetime('now'),
    datetime('now')
);
