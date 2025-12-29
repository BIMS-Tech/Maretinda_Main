-- Check what sellers exist
SELECT id, name, email, dft_bank_name FROM seller LIMIT 5;

-- Check orders and their sales channels
SELECT 
  o.id,
  o.sales_channel_id,
  o.email,
  o.created_at
FROM "order" o
WHERE o.id IN ('ordset_01KCYEJS15TQD72XYH3R5CCSN5', 'ordset_01KCXY0WD42KFQTBF5CQ1YMW6B')
ORDER BY o.created_at DESC;
