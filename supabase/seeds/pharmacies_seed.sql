INSERT INTO public.pharmacies (name, address, owner) VALUES
('MediCare Pharmacy', '123 Rizal St, Manila', 'Jose Reyes'),
('HealthPlus Drugstore', '456 Mabini Ave, Quezon City', 'Maria Santos'),
('CureWell Pharmacy', '789 Bonifacio Blvd, Makati', 'Carlos Dela Cruz'),
('PharmaFirst', '321 Luna St, Pasig', 'Ana Flores'),
('MedExpress Pharmacy', '654 Aguinaldo Rd, Taguig', 'Roberto Tan'),
('LifeCare Drugstore', '987 Osmena Blvd, Cebu City', 'Patricia Lim'),
('RxPlus Pharmacy', '147 Roxas Blvd, Paranaque', 'Miguel Cruz'),
('WellMed Pharmacy', '258 Quezon Ave, Caloocan', 'Sophia Navarro'),
('TotalHealth Pharmacy', '369 Shaw Blvd, Mandaluyong', 'Antonio Garcia'),
('PrimeCare Drugstore', '741 EDSA, Pasay', 'Luisa Torres')
ON CONFLICT DO NOTHING;
