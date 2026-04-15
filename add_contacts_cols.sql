ALTER TABLE contacts ADD COLUMN IF NOT EXISTS whatsapp varchar(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS instagram varchar(255);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tiktok varchar(255);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS condicion_iva varchar(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS cuit varchar(20);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS condicion_iibb varchar(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS calificacion integer DEFAULT 5;
