-- Product Classes
CREATE TABLE product_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage product_classes"
ON product_classes FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Product Categories (belongs to a class)
CREATE TABLE product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  class_id uuid NOT NULL REFERENCES product_classes(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (name, class_id)
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage product_categories"
ON product_categories FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Packaging Units
CREATE TABLE packaging_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  abbreviation text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE packaging_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage packaging_units"
ON packaging_units FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Dispensing Units
CREATE TABLE dispensing_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  abbreviation text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dispensing_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage dispensing_units"
ON dispensing_units FOR ALL TO authenticated
USING (true) WITH CHECK (true);
