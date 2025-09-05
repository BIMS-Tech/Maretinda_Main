# DFT (Data File Transfer) Implementation Guide

## Overview

The DFT system enables automatic generation of bank transfer files in MBOS (Metrobank Operating System) format for vendor payouts in the Philippines marketplace. This implementation follows the specific MBOS requirements for bulk fund transfers.

## Architecture

### Components

1. **DFT Module** (`mercur/packages/modules/dft/`)
   - Data models for configuration and file generation
   - Service layer for DFT operations
   - File generator with MBOS format compliance

2. **Vendor Panel Integration** (`vendor-panel/`)
   - Bank information forms in store settings
   - DFT fields validation
   - User interface for managing bank details

3. **Admin Dashboard** (`mercur/apps/backend/src/admin/routes/dft/`)
   - DFT file generation interface
   - Vendor selection and validation
   - File download and management

4. **Workflows** (`mercur/apps/backend/src/workflows/dft/`)
   - Automated DFT generation workflow
   - Payout integration workflow
   - Validation and error handling

## File Format Specification

The DFT file follows MBOS requirements with the following format:

```
D|Remittance Type|Currency|Amount|Source Account|Destination Account Number|1|Beneficiary Code|Beneficiary Name||||Beneficiary Address|SWIFT Code|Beneficiary Bank Address||Purpose|||0|||
```

### Format Changes from Original
- Position 14: "SWIFT Code" (changed from "Beneficiary Bank")
- Position 16: Removed (was "Swift Code")
- Position 17: "DFT <Date of GiyaPay Transaction>"
- Position 20: "0" (Charge Type)

### Example Line
```
D|TT|PHP|50000.00|123456789|987654321|1|VENDOR001|Sample Vendor||||123 Main St, Manila, Philippines|BPIPHKHH|BPI Main Branch, Ayala Ave, Makati||DFT 2025-01-04|||0|||
```

## Database Schema

### DFT Configuration
```sql
CREATE TABLE dft_configuration (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  bank_code TEXT,
  swift_code TEXT NOT NULL,
  bank_address TEXT NOT NULL,
  beneficiary_name TEXT NOT NULL,
  beneficiary_code TEXT NOT NULL,
  beneficiary_address TEXT NOT NULL,
  account_number TEXT NOT NULL,
  remittance_type TEXT DEFAULT 'TT',
  currency TEXT DEFAULT 'PHP',
  charge_type TEXT DEFAULT '0',
  source_account TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMPTZ,
  created_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### DFT Generation
```sql
CREATE TABLE dft_generation (
  id TEXT PRIMARY KEY,
  batch_id TEXT UNIQUE NOT NULL,
  generation_date TIMESTAMPTZ NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT,
  status TEXT CHECK (status IN ('pending', 'generated', 'downloaded', 'processed', 'failed')) DEFAULT 'pending',
  total_amount NUMERIC NOT NULL,
  transaction_count INTEGER NOT NULL,
  currency TEXT DEFAULT 'PHP',
  generated_by TEXT NOT NULL,
  processed_at TIMESTAMPTZ,
  downloaded_at TIMESTAMPTZ,
  file_size INTEGER,
  checksum TEXT,
  notes TEXT,
  error_message TEXT
);
```

### DFT Transaction
```sql
CREATE TABLE dft_transaction (
  id TEXT PRIMARY KEY,
  dft_generation_id TEXT NOT NULL,
  payout_id TEXT NOT NULL,
  order_id TEXT,
  seller_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'PHP',
  beneficiary_name TEXT NOT NULL,
  beneficiary_code TEXT NOT NULL,
  beneficiary_account TEXT NOT NULL,
  beneficiary_address TEXT NOT NULL,
  swift_code TEXT NOT NULL,
  bank_address TEXT NOT NULL,
  remittance_type TEXT DEFAULT 'TT',
  source_account TEXT NOT NULL,
  purpose TEXT NOT NULL,
  charge_type TEXT DEFAULT '0',
  status TEXT CHECK (status IN ('pending', 'included', 'processed', 'failed', 'excluded')) DEFAULT 'pending',
  line_number INTEGER,
  transaction_date TIMESTAMPTZ NOT NULL,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);
```

## Vendor Integration

### Required DFT Fields
Vendors must provide the following information in their store settings:

- **Bank Name**: Name of the receiving bank
- **Bank Code**: Optional bank identifier code
- **SWIFT Code**: International bank identifier (required)
- **Bank Address**: Physical address of the bank
- **Beneficiary Name**: Name of the account holder
- **Beneficiary Code**: Unique identifier for the beneficiary
- **Beneficiary Address**: Address of the account holder
- **Account Number**: Bank account number for transfers

### Validation Rules
- SWIFT code must follow format: `^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$`
- Only PHP currency is supported
- All required fields must be filled for DFT inclusion
- Bank information is validated before file generation

## Admin Operations

### DFT File Generation Process

1. **Select Vendors**: Choose vendors with complete DFT information
2. **Configure Source Account**: Set marketplace account for transfers
3. **Generate File**: Create DFT file with validation
4. **Download File**: Retrieve generated file for MBOS upload
5. **Track Status**: Monitor file processing status

### API Endpoints

```typescript
// List DFT generations
GET /admin/dft

// Create DFT generation
POST /admin/dft

// Get specific DFT generation
GET /admin/dft/{id}

// Generate DFT file
POST /admin/dft/generate

// Download DFT file
GET /admin/dft/{id}/download
```

## Workflow Integration

### Generate DFT File Workflow
```typescript
const { result } = await generateDftFileWorkflow(container).run({
  input: {
    seller_ids: ["sel_123", "sel_456"],
    source_account: "123456789",
    generated_by: "admin_001",
    notes: "Monthly payout batch"
  }
})
```

### Process DFT Payout Workflow
```typescript
const { result } = await processDftPayoutWorkflow(container).run({
  input: {
    payout_id: "pout_123",
    dft_generation_id: "dft_gen_456",
    line_number: 1
  }
})
```

## Philippine Banking Context

### MBOS Integration
- **File Format**: Pipe-delimited text file
- **Upload Schedule**: Daily before 2-3 PM cut-off
- **Processing**: T+0 (same day) or T+1 (next business day)
- **Crediting**: End-of-day batch processing

### Supported Transfer Types
- **TT (Telegraphic Transfer)**: Standard bank transfer
- **Currency**: PHP only
- **Charge Type**: 0 (charged to sender/marketplace)

### Bank Networks
- **PESONet**: For smaller amounts
- **InstaPay**: For instant transfers
- **RTGS**: For large value transfers

## Error Handling

### Validation Errors
- Missing DFT information
- Invalid SWIFT codes
- Incorrect amount formats
- Unsupported currencies

### File Generation Errors
- Insufficient vendor data
- File system permissions
- Network connectivity issues
- Workflow execution failures

### Recovery Procedures
- Retry mechanisms for failed generations
- Manual intervention for validation issues
- Error logging and notification system
- Rollback capabilities for failed transactions

## Security Considerations

### Data Protection
- Bank information encryption at rest
- Secure file storage and transmission
- Access control for DFT operations
- Audit logging for all activities

### Compliance
- PCI DSS compliance for financial data
- BSP (Bangko Sentral ng Pilipinas) regulations
- GDPR compliance for personal data
- Anti-money laundering (AML) requirements

## Monitoring and Analytics

### Key Metrics
- DFT file generation success rate
- Vendor completion rate for bank information
- Processing time for file generation
- Error rates and types

### Alerts and Notifications
- Failed file generations
- Validation errors requiring attention
- Missing vendor information
- System performance issues

## Future Enhancements

### Planned Features
- Automated scheduling for DFT generation
- Real-time payout status tracking
- Integration with multiple Philippine banks
- Enhanced reporting and analytics
- Mobile app support for vendors

### Integration Opportunities
- GiyaPay API integration
- Real-time bank balance checking
- Automated reconciliation
- SMS/email notifications for vendors

## Support and Maintenance

### Regular Tasks
- Monitor file generation success rates
- Update bank SWIFT codes as needed
- Validate vendor bank information
- Backup and archive DFT files

### Troubleshooting
- Check vendor DFT field completion
- Verify MBOS file format compliance
- Validate bank connectivity
- Review workflow execution logs

## Getting Started

1. **Enable DFT Module**: Add to medusa-config.ts
2. **Run Migrations**: Create DFT database tables
3. **Configure Admin**: Access DFT dashboard
4. **Set Up Vendors**: Complete bank information
5. **Generate First File**: Test with small batch
6. **Upload to MBOS**: Process first transaction

For technical support or questions, contact the development team or refer to the API documentation.
