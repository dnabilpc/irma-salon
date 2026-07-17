CREATE TABLE IF NOT EXISTS vto_tasks (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
    person_image_url TEXT NOT NULL,
    clothes_image_url TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    result_image_url TEXT,
    garment_description TEXT,
    error_message TEXT,
    outfit_name VARCHAR(255),
    user_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE vto_tasks ADD COLUMN IF NOT EXISTS outfit_name VARCHAR(255);
ALTER TABLE vto_tasks ADD COLUMN IF NOT EXISTS user_notified BOOLEAN DEFAULT FALSE;
