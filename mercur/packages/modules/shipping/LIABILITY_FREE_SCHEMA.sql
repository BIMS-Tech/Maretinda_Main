-- Database schema for liability-free shipping facilitation

-- Table for vendor shipping liability terms agreement
CREATE TABLE vendor_shipping_terms_agreement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id VARCHAR(255) UNIQUE NOT NULL,
    agreed_at TIMESTAMP NOT NULL,
    terms JSONB NOT NULL, -- All liability acknowledgments
    ip_address INET NOT NULL,
    user_agent TEXT NOT NULL,
    signature TEXT, -- Optional digital signature
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_vendor_terms (vendor_id, agreed_at)
);

-- Log table for shipping facilitation activities (not shipping data)
CREATE TABLE shipping_facilitation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id VARCHAR(255) NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    facilitation_type VARCHAR(50) NOT NULL, -- 'quotation', 'order_placement', 'tracking'
    vendor_order_id VARCHAR(255),
    provider_order_id VARCHAR(255),
    facilitated_at TIMESTAMP NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for analytics
    INDEX idx_facilitation_vendor (vendor_id, facilitated_at),
    INDEX idx_facilitation_type (facilitation_type, facilitated_at),
    INDEX idx_facilitation_provider (provider_id, facilitated_at)
);

-- Table for provider setup guidance tracking
CREATE TABLE vendor_provider_setup_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id VARCHAR(255) NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    setup_status VARCHAR(50) NOT NULL, -- 'not_started', 'in_progress', 'completed', 'failed'
    setup_step VARCHAR(100), -- Current step in setup process
    credentials_validated BOOLEAN DEFAULT false,
    test_quotation_successful BOOLEAN DEFAULT false,
    first_order_placed BOOLEAN DEFAULT false,
    setup_started_at TIMESTAMP,
    setup_completed_at TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    
    UNIQUE(vendor_id, provider_id),
    INDEX idx_vendor_setup_status (vendor_id, setup_status),
    INDEX idx_provider_setup_status (provider_id, setup_status)
);

-- Table for liability waiver documents
CREATE TABLE shipping_liability_waivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id VARCHAR(255) NOT NULL,
    waiver_type VARCHAR(50) NOT NULL, -- 'initial_setup', 'periodic_renewal'
    waiver_content TEXT NOT NULL,
    generated_at TIMESTAMP NOT NULL,
    acknowledged_at TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    digital_signature TEXT,
    expires_at TIMESTAMP, -- Optional expiration for periodic renewals
    metadata JSONB DEFAULT '{}',
    
    INDEX idx_vendor_waivers (vendor_id, generated_at),
    INDEX idx_waiver_acknowledgment (acknowledged_at),
    INDEX idx_waiver_expiration (expires_at)
);

-- Analytics table for facilitation metrics (no liability data)
CREATE TABLE shipping_facilitation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    
    -- Volume metrics (facilitation only)
    quotations_facilitated INTEGER DEFAULT 0,
    orders_facilitated INTEGER DEFAULT 0,
    tracking_requests_facilitated INTEGER DEFAULT 0,
    
    -- Setup metrics
    new_vendor_setups INTEGER DEFAULT 0,
    completed_setups INTEGER DEFAULT 0,
    failed_setups INTEGER DEFAULT 0,
    
    -- No cost/liability metrics - just facilitation counts
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(date, provider_id),
    INDEX idx_facilitation_analytics_date (date),
    INDEX idx_facilitation_analytics_provider (provider_id)
);

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_vendor_terms_updated_at 
    BEFORE UPDATE ON vendor_shipping_terms_agreement 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX CONCURRENTLY idx_facilitation_recent 
ON shipping_facilitation_log(vendor_id, facilitated_at DESC) 
WHERE facilitated_at > NOW() - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY idx_active_setups 
ON vendor_provider_setup_status(vendor_id, provider_id) 
WHERE setup_status IN ('not_started', 'in_progress');

-- Views for reporting (no liability exposure)
CREATE VIEW vendor_shipping_facilitation_summary AS
SELECT 
    vendor_id,
    COUNT(DISTINCT provider_id) as providers_used,
    COUNT(*) FILTER (WHERE facilitation_type = 'quotation') as quotations_facilitated,
    COUNT(*) FILTER (WHERE facilitation_type = 'order_placement') as orders_facilitated,
    COUNT(*) FILTER (WHERE facilitation_type = 'tracking') as tracking_facilitated,
    MIN(facilitated_at) as first_facilitation,
    MAX(facilitated_at) as last_facilitation
FROM shipping_facilitation_log
GROUP BY vendor_id;

CREATE VIEW provider_facilitation_summary AS
SELECT 
    provider_id,
    COUNT(DISTINCT vendor_id) as active_vendors,
    COUNT(*) FILTER (WHERE facilitation_type = 'quotation') as total_quotations,
    COUNT(*) FILTER (WHERE facilitation_type = 'order_placement') as total_orders,
    DATE_TRUNC('month', facilitated_at) as month
FROM shipping_facilitation_log
GROUP BY provider_id, DATE_TRUNC('month', facilitated_at);

-- Comments explaining liability protection
COMMENT ON TABLE vendor_shipping_terms_agreement IS 'Records vendor acknowledgment that they are solely responsible for shipping operations';
COMMENT ON TABLE shipping_facilitation_log IS 'Logs platform facilitation activities only - no shipping liability data';
COMMENT ON TABLE shipping_liability_waivers IS 'Legal documents protecting platform from shipping-related claims';
COMMENT ON COLUMN shipping_facilitation_log.facilitation_type IS 'Type of facilitation provided - platform is not liable for actual shipping';
COMMENT ON VIEW vendor_shipping_facilitation_summary IS 'Summary of facilitation services provided - no liability implications';








































