-- Add separate address fields to clients table
ALTER TABLE clients
ADD COLUMN street1 TEXT,
ADD COLUMN street2 TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN zip TEXT;

-- Migrate existing address data if needed
-- Since the old address field might have data, we'll keep it for reference
-- but not drop it immediately in case data needs to be manually migrated

-- Add a comment to indicate the old field is deprecated
COMMENT ON COLUMN clients.address IS 'Deprecated: Use street1, street2, city, state, zip instead';

