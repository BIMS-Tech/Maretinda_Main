-- Check what columns exist in giyapay_transaction
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'giyapay_transaction'
ORDER BY ordinal_position;

-- Check the actual data
SELECT * FROM giyapay_transaction LIMIT 2;
