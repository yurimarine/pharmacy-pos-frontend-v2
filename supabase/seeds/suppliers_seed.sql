INSERT INTO public.suppliers (name, contact_person, phone, email, address) VALUES
('MedSupply PH', 'Juan dela Cruz', '09171234567', 'juan@medsupply.ph', '123 Rizal St, Manila'),
('PharmaCore Inc.', 'Maria Santos', '09281234567', 'maria@pharmacore.com', '456 Mabini Ave, Quezon City'),
('HealthBridge Trading', 'Carlos Reyes', '09391234567', 'carlos@healthbridge.ph', '789 Bonifacio Blvd, Makati'),
('MediLink Distributors', 'Ana Flores', '09501234567', 'ana@medilink.com', '321 Luna St, Pasig'),
('RxSource Philippines', 'Roberto Tan', '09611234567', 'roberto@rxsource.ph', '654 Aguinaldo Rd, Taguig'),
('GlobalMed Supply', 'Patricia Lim', '09721234567', 'patricia@globalmed.ph', '987 Osmena Blvd, Cebu City'),
('PharmaDirect Co.', 'Miguel Cruz', '09831234567', 'miguel@pharmadirect.com', '147 Roxas Blvd, Paranaque'),
('MedEssentials PH', 'Sophia Navarro', '09941234567', 'sophia@medessentials.ph', '258 Quezon Ave, Caloocan')
ON CONFLICT DO NOTHING;
