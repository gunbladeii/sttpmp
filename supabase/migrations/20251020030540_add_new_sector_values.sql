-- Add new sector values to enum
ALTER TYPE sector_type ADD VALUE IF NOT EXISTS 'SDP';
ALTER TYPE sector_type ADD VALUE IF NOT EXISTS 'SDTM';
ALTER TYPE sector_type ADD VALUE IF NOT EXISTS 'SSJK';
