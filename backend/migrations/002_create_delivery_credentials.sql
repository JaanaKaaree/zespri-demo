-- ============================================
-- DELIVERY CREDENTIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_credentials (
    id VARCHAR(255) PRIMARY KEY, -- MATTR credential ID
    delivery_id VARCHAR(50) NOT NULL, -- Format: DEL-YYYYMMDD-XXXXXX
    origin_address VARCHAR(500) NOT NULL,
    destination_address VARCHAR(500) NOT NULL,
    delivery_start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    delivery_end_datetime TIMESTAMP WITH TIME ZONE,
    driver_id VARCHAR(255) NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    vehicle_id VARCHAR(255) NOT NULL,
    collection_id VARCHAR(50), -- Optional reference to collection credential
    nzbn VARCHAR(13) NOT NULL, -- 13-digit NZBN
    recipient_did VARCHAR(255), -- Decentralized Identifier
    recipient_email VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'issued', 'failed'
    credential_id VARCHAR(255), -- MATTR credential ID (may differ from id)
    issuance_url TEXT,
    qr_code JSONB, -- { qrcode: string, type: string }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT delivery_credentials_status_check CHECK (status IN ('pending', 'issued', 'failed')),
    CONSTRAINT delivery_credentials_nzbn_check CHECK (nzbn ~ '^\d{13}$')
);

CREATE INDEX IF NOT EXISTS idx_delivery_credentials_delivery_id ON delivery_credentials(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_credentials_nzbn ON delivery_credentials(nzbn);
CREATE INDEX IF NOT EXISTS idx_delivery_credentials_driver_id ON delivery_credentials(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_credentials_vehicle_id ON delivery_credentials(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_delivery_credentials_collection_id ON delivery_credentials(collection_id);
CREATE INDEX IF NOT EXISTS idx_delivery_credentials_status ON delivery_credentials(status);
CREATE INDEX IF NOT EXISTS idx_delivery_credentials_delivery_start ON delivery_credentials(delivery_start_datetime);
CREATE INDEX IF NOT EXISTS idx_delivery_credentials_created_at ON delivery_credentials(created_at);

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================
DROP TRIGGER IF EXISTS update_delivery_credentials_updated_at ON delivery_credentials;
CREATE TRIGGER update_delivery_credentials_updated_at BEFORE UPDATE ON delivery_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
