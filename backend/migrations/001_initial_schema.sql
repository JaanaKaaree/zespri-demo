-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- bcrypt hashed
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY, -- session ID (typically UUID or token)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    data JSONB, -- Store additional session data (e.g., nzbnOAuthToken)
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_data_gin ON sessions USING GIN(data); -- For JSONB queries

-- ============================================
-- COLLECTION CREDENTIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS collection_credentials (
    id VARCHAR(255) PRIMARY KEY, -- MATTR credential ID
    collection_id VARCHAR(50) NOT NULL, -- Format: COL-YYYYMMDD-XXXXXX
    bin_identifier VARCHAR(255) NOT NULL,
    row_identifier VARCHAR(255) NOT NULL,
    harvest_start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    harvest_end_datetime TIMESTAMP WITH TIME ZONE,
    picker_id VARCHAR(255) NOT NULL,
    picker_name VARCHAR(255) NOT NULL,
    nzbn VARCHAR(13) NOT NULL, -- 13-digit NZBN
    orchard_id VARCHAR(255) NOT NULL,
    recipient_did VARCHAR(255), -- Decentralized Identifier
    recipient_email VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'issued', 'failed'
    credential_id VARCHAR(255), -- MATTR credential ID (may differ from id)
    issuance_url TEXT,
    qr_code JSONB, -- { qrcode: string, type: string }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT collection_credentials_status_check CHECK (status IN ('pending', 'issued', 'failed')),
    CONSTRAINT collection_credentials_nzbn_check CHECK (nzbn ~ '^\d{13}$')
);

CREATE INDEX IF NOT EXISTS idx_collection_credentials_collection_id ON collection_credentials(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_credentials_nzbn ON collection_credentials(nzbn);
CREATE INDEX IF NOT EXISTS idx_collection_credentials_orchard_id ON collection_credentials(orchard_id);
CREATE INDEX IF NOT EXISTS idx_collection_credentials_picker_id ON collection_credentials(picker_id);
CREATE INDEX IF NOT EXISTS idx_collection_credentials_status ON collection_credentials(status);
CREATE INDEX IF NOT EXISTS idx_collection_credentials_harvest_start ON collection_credentials(harvest_start_datetime);
CREATE INDEX IF NOT EXISTS idx_collection_credentials_created_at ON collection_credentials(created_at);

-- ============================================
-- OAUTH TOKENS TABLE (Optional - for better token management)
-- ============================================
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'nzbn', 'mattr', etc.
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT oauth_tokens_provider_check CHECK (provider IN ('nzbn', 'mattr'))
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider ON oauth_tokens(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_tokens_user_provider ON oauth_tokens(user_id, provider);

-- ============================================
-- ORGANISATION PARTS CACHE TABLE (Optional - for caching NZBN data)
-- ============================================
CREATE TABLE IF NOT EXISTS organisation_parts_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nzbn VARCHAR(13) NOT NULL,
    opn VARCHAR(255), -- Organisation Part Number
    data JSONB NOT NULL, -- Full organisation part data from NZBN API
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT organisation_parts_cache_nzbn_check CHECK (nzbn ~ '^\d{13}$')
);

CREATE INDEX IF NOT EXISTS idx_org_parts_cache_nzbn ON organisation_parts_cache(nzbn);
CREATE INDEX IF NOT EXISTS idx_org_parts_cache_opn ON organisation_parts_cache(opn);
CREATE INDEX IF NOT EXISTS idx_org_parts_cache_expires_at ON organisation_parts_cache(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_parts_cache_nzbn_opn ON organisation_parts_cache(nzbn, opn) WHERE opn IS NOT NULL;

-- ============================================
-- AUDIT LOG TABLE (Optional - for tracking changes)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'collection_credential', 'user', etc.
    entity_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collection_credentials_updated_at ON collection_credentials;
CREATE TRIGGER update_collection_credentials_updated_at BEFORE UPDATE ON collection_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_oauth_tokens_updated_at ON oauth_tokens;
CREATE TRIGGER update_oauth_tokens_updated_at BEFORE UPDATE ON oauth_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CLEANUP FUNCTION FOR EXPIRED SESSIONS
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ language 'plpgsql';

-- ============================================
-- CLEANUP FUNCTION FOR EXPIRED CACHE
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM organisation_parts_cache WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ language 'plpgsql';
