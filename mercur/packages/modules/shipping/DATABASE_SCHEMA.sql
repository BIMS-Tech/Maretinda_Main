-- Database schema for vendor-specific shipping management

-- Table for storing vendor-specific shipping provider credentials
CREATE TABLE vendor_shipping_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id VARCHAR(255) NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    credentials JSONB NOT NULL, -- Encrypted credentials
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    
    -- Ensure one credential per vendor per provider
    UNIQUE(vendor_id, provider_id),
    
    -- Index for faster lookups
    INDEX idx_vendor_credentials_lookup (vendor_id, provider_id, is_active)
);

-- Table for vendor shipping configuration and preferences
CREATE TABLE vendor_shipping_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id VARCHAR(255) UNIQUE NOT NULL,
    enabled_providers JSONB DEFAULT '[]', -- Array of enabled provider IDs
    default_provider VARCHAR(100),
    preferences JSONB DEFAULT '{}', -- Auto-select, thresholds, etc.
    billing_config JSONB DEFAULT '{}', -- Payment method, markup, fees
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_vendor_config (vendor_id)
);

-- Enhanced shipping orders table with vendor context
CREATE TABLE vendor_shipping_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id VARCHAR(255) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    provider_order_id VARCHAR(255) NOT NULL,
    quotation_id VARCHAR(255),
    
    -- Billing information
    vendor_cost DECIMAL(10,2),
    marketplace_cost DECIMAL(10,2),
    markup_amount DECIMAL(10,2),
    billing_responsibility VARCHAR(20), -- 'vendor' or 'marketplace'
    credentials_source VARCHAR(20), -- 'vendor' or 'marketplace'
    
    -- Order details
    status VARCHAR(50) NOT NULL,
    tracking_number VARCHAR(255),
    tracking_url TEXT,
    share_link TEXT,
    
    -- Addresses
    pickup_address TEXT NOT NULL,
    pickup_coordinates JSONB,
    delivery_address TEXT NOT NULL,
    delivery_coordinates JSONB,
    
    -- Contact information
    sender_name VARCHAR(255) NOT NULL,
    sender_phone VARCHAR(50) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    
    -- Delivery information
    estimated_delivery TIMESTAMP,
    actual_delivery TIMESTAMP,
    
    -- Driver information
    driver_id VARCHAR(255),
    driver_name VARCHAR(255),
    driver_phone VARCHAR(50),
    driver_vehicle VARCHAR(255),
    
    -- Proof of delivery
    pod_status VARCHAR(50),
    pod_images JSONB DEFAULT '[]',
    
    -- Metadata and timestamps
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_vendor_orders_vendor (vendor_id),
    INDEX idx_vendor_orders_provider (provider_id),
    INDEX idx_vendor_orders_status (status),
    INDEX idx_vendor_orders_date (created_at),
    INDEX idx_vendor_orders_lookup (vendor_id, provider_id, status)
);

-- Table for tracking vendor shipping analytics
CREATE TABLE vendor_shipping_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id VARCHAR(255) NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    
    -- Volume metrics
    total_orders INTEGER DEFAULT 0,
    successful_orders INTEGER DEFAULT 0,
    failed_orders INTEGER DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,
    
    -- Cost metrics
    total_cost DECIMAL(12,2) DEFAULT 0,
    total_vendor_cost DECIMAL(12,2) DEFAULT 0,
    total_marketplace_cost DECIMAL(12,2) DEFAULT 0,
    total_markup DECIMAL(12,2) DEFAULT 0,
    
    -- Performance metrics
    average_delivery_time INTEGER, -- in minutes
    on_time_delivery_rate DECIMAL(5,2), -- percentage
    customer_satisfaction_score DECIMAL(3,2),
    
    -- Provider-specific metrics
    provider_metrics JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicates
    UNIQUE(vendor_id, provider_id, date),
    
    INDEX idx_vendor_analytics (vendor_id, date),
    INDEX idx_provider_analytics (provider_id, date)
);

-- Table for marketplace-wide shipping provider configurations (fallback)
CREATE TABLE marketplace_shipping_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'same_day', 'express', 'international'
    enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    configuration JSONB NOT NULL, -- Encrypted marketplace credentials
    supported_markets JSONB DEFAULT '[]',
    supported_service_types JSONB DEFAULT '[]',
    capabilities JSONB DEFAULT '{}',
    rate_limits JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_marketplace_config_enabled (enabled, priority)
);

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_vendor_credentials_active 
ON vendor_shipping_credentials(vendor_id) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_vendor_orders_recent 
ON vendor_shipping_orders(vendor_id, created_at DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_vendor_credentials_updated_at 
    BEFORE UPDATE ON vendor_shipping_credentials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_config_updated_at 
    BEFORE UPDATE ON vendor_shipping_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_orders_updated_at 
    BEFORE UPDATE ON vendor_shipping_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_analytics_updated_at 
    BEFORE UPDATE ON vendor_shipping_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_config_updated_at 
    BEFORE UPDATE ON marketplace_shipping_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();









































