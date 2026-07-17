ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_payment_method_check;

ALTER TABLE transactions 
ADD CONSTRAINT transactions_payment_method_check 
CHECK (payment_method IN ('cash', 'qris'));

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'transactions' 
          AND column_name = 'midtrans_status'
    ) THEN
        ALTER TABLE transactions RENAME COLUMN midtrans_status TO status;
    END IF;
END $$;

UPDATE transactions SET status = 'pending' WHERE status IS NULL;

ALTER TABLE transactions 
ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE transactions 
ALTER COLUMN status SET NOT NULL;

ALTER TABLE transactions DROP COLUMN IF EXISTS midtrans_transaction_id;
ALTER TABLE transactions DROP COLUMN IF EXISTS midtrans_fraud_status;
ALTER TABLE transactions DROP COLUMN IF EXISTS midtrans_payment_type;
ALTER TABLE transactions DROP COLUMN IF EXISTS midtrans_settlement_time;
ALTER TABLE transactions DROP COLUMN IF EXISTS midtrans_signature_key;
ALTER TABLE transactions DROP COLUMN IF EXISTS midtrans_pdf_url;

UPDATE transactions SET status = 'lunas' WHERE status = 'settlement' OR status = 'capture';
