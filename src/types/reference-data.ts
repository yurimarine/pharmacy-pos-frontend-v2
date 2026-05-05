export type ProductClass = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductCategory = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type PackagingUnit = {
  id: string;
  name: string;
  abbreviation: string;
  created_at: string;
  updated_at: string;
};

export type DispensingUnit = {
  id: string;
  name: string;
  abbreviation: string;
  created_at: string;
  updated_at: string;
};
