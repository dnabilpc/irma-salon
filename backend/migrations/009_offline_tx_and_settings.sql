ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS category_type VARCHAR(50) DEFAULT 'salon',
ADD COLUMN IF NOT EXISTS notes TEXT;

INSERT INTO settings (key, value)
VALUES 
    ('vto_milestones_config', '[{"rentals_count": 1, "bonus_limit": 2}, {"rentals_count": 3, "bonus_limit": 4}, {"rentals_count": 6, "bonus_limit": 6}, {"rentals_count": 10, "bonus_limit": 10}]'),
    ('vto_bonus_expiry_days', '30'),
    ('qris_payload', '00020101021126580016ID.CO.QRIS.WWW01189360091400000000005204599953033605802ID5918RUMAH CANTIK IRMA6008SURABAYA6304B76B')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'unspecified';

ALTER TABLE outfit_catalogues 
ADD COLUMN IF NOT EXISTS target_gender VARCHAR(20) DEFAULT 'unisex',
ADD COLUMN IF NOT EXISTS target_age VARCHAR(20) DEFAULT 'semua_umur';
