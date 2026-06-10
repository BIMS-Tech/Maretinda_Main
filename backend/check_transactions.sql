-- Check GiyaPay transactions
SELECT 
  gt.id,
  gt.reference_number,
  gt.status,
  gt.amount,
  gt.seller_id,
  s.name as seller_name,
  s.dft_bank_name,
  s.dft_swift_code,
  s.dft_account_number,
  s.dft_beneficiary_name,
  s.dft_beneficiary_address,
  s.dft_bank_address
FROM giyapay_transaction gt
LEFT JOIN seller s ON s.id = gt.seller_id
ORDER BY gt.created_at DESC
LIMIT 5;
