-- ============================================
-- CREDENTIAL VERIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS credential_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id VARCHAR(255) NOT NULL, -- MATTR credential ID
    credential_type VARCHAR(20) NOT NULL, -- 'collection' or 'delivery'
    user_id VARCHAR(255), -- from mobile app
    mobile_application_id VARCHAR(255), -- from mobile app
    verified BOOLEAN NOT NULL, -- verification result
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- when verification occurred
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- record creation time
    CONSTRAINT credential_verifications_type_check CHECK (credential_type IN ('collection', 'delivery'))
);

CREATE INDEX IF NOT EXISTS idx_credential_verifications_credential_id ON credential_verifications(credential_id);
CREATE INDEX IF NOT EXISTS idx_credential_verifications_credential_type ON credential_verifications(credential_type);
CREATE INDEX IF NOT EXISTS idx_credential_verifications_user_id ON credential_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_credential_verifications_mobile_app_id ON credential_verifications(mobile_application_id);
CREATE INDEX IF NOT EXISTS idx_credential_verifications_verified_at ON credential_verifications(verified_at);
CREATE INDEX IF NOT EXISTS idx_credential_verifications_created_at ON credential_verifications(created_at);
