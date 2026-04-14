-- Drop old type column (will be replaced with enum)
-- NOTE: Only run this if no data exists in products table
-- If products table has data, truncate it first
ALTER TABLE products DROP COLUMN IF EXISTS type;

-- New product type enum
CREATE TYPE product_type_new AS ENUM ('branded', 'generic', 'na');

-- New product status enum
CREATE TYPE product_status AS ENUM ('active', 'inactive', 'discontinued');

-- ─── ALTER PRODUCTS TABLE ───────────────────────────────────────────────────

-- Remove old columns
ALTER TABLE products DROP COLUMN IF EXISTS category;
ALTER TABLE products DROP COLUMN IF EXISTS is_active;

-- Add new columns
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sku text UNIQUE,
  ADD COLUMN IF NOT EXISTS barcode text UNIQUE,
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES product_classes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS type product_type_new NOT NULL DEFAULT 'na',
  ADD COLUMN IF NOT EXISTS packaging_unit_id uuid REFERENCES packaging_units(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unit_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS dispensing_unit_id uuid REFERENCES dispensing_units(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status product_status NOT NULL DEFAULT 'active';

-- ─── ALTER INVENTORY TABLE ───────────────────────────────────────────────────

ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS expiry_date date,
  ADD COLUMN IF NOT EXISTS last_restocked_at timestamptz;
