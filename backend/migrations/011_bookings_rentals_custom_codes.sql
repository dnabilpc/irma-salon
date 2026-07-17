ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;

ALTER TABLE rentals
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;

UPDATE bookings 
SET code = 'BK-' || id 
WHERE code IS NULL;

UPDATE bookings 
SET created_at = booking_datetime 
WHERE created_at IS NULL;

UPDATE rentals 
SET code = 'RT-' || id 
WHERE code IS NULL;

UPDATE rentals 
SET created_at = start_date 
WHERE created_at IS NULL;
