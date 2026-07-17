CREATE TABLE IF NOT EXISTS rental_orders (
    id             SERIAL PRIMARY KEY,
    user_id        TEXT REFERENCES "user"(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    notes          TEXT,
    customer_name  VARCHAR(255),
    customer_phone VARCHAR(50)
);

ALTER TABLE rentals
ADD COLUMN IF NOT EXISTS rental_order_id INTEGER REFERENCES rental_orders(id) ON DELETE SET NULL;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS rental_order_id INTEGER REFERENCES rental_orders(id) ON DELETE SET NULL;

ALTER TABLE booking_details
ADD COLUMN IF NOT EXISTS booking_datetime TIMESTAMPTZ;

UPDATE booking_details bd
SET booking_datetime = b.booking_datetime
FROM bookings b
WHERE b.id = bd.booking_id
  AND bd.booking_datetime IS NULL;
