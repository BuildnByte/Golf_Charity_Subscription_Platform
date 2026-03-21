ALTER TABLE draws DROP CONSTRAINT IF EXISTS draws_status_check;
ALTER TABLE draws ADD CONSTRAINT draws_status_check CHECK (status IN ('upcoming', 'active', 'simulating', 'drawn', 'published'));
