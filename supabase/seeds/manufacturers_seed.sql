INSERT INTO public.manufacturers (name) VALUES
('Unilab Philippines'),
('Pfizer Philippines'),
('GlaxoSmithKline PH'),
('Novartis Philippines'),
('Abbott Laboratories PH'),
('Roche Philippines'),
('Merck Sharp & Dohme PH'),
('Sanofi Philippines'),
('AstraZeneca PH'),
('Johnson & Johnson PH')
ON CONFLICT DO NOTHING;
