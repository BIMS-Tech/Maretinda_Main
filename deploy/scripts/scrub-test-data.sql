-- Turns a restored copy of production into safe test data. Run on the TEST
-- server only, through scripts/refresh-test-data.sh (one transaction).
--
-- After this:
--   * no real customer, seller or applicant email/phone/bank detail remains,
--     so a test order or password reset can never reach a real person.
--     Emails become delivered+<id>@resend.dev, Resend's test inbox: sends
--     succeed without delivering anything or hurting the domain's reputation.
--   * admin accounts (the `user` table) and anyone on a team domain below are
--     kept, so the team can still sign in.
--   * couriers are switched off (Flying Tigers has no sandbox, so a booking
--     would be a real pickup) and GiyaPay is forced into sandbox mode.
--   * names and cities are kept so pages still look realistic.

CREATE FUNCTION pg_temp.keep(email text) RETURNS boolean
  LANGUAGE sql IMMUTABLE
  AS $$ SELECT coalesce(email ~* '@(bims\.tech|maretinda\.com)$', false) $$;

CREATE FUNCTION pg_temp.fake_email(id text) RETURNS text
  LANGUAGE sql IMMUTABLE
  AS $$ SELECT 'delivered+' || id || '@resend.dev' $$;

-- A valid PH mobile, so courier phone checks still pass
CREATE FUNCTION pg_temp.fake_phone() RETURNS text
  LANGUAGE sql IMMUTABLE
  AS $$ SELECT '09170000000' $$;

-- ── Customers, carts, orders ────────────────────────────────────────────────
UPDATE customer
   SET email = pg_temp.fake_email(id),
       phone = CASE WHEN phone IS NULL THEN NULL ELSE pg_temp.fake_phone() END
 WHERE NOT pg_temp.keep(email);

UPDATE cart    SET email = pg_temp.fake_email(id) WHERE email IS NOT NULL AND NOT pg_temp.keep(email);
UPDATE "order" SET email = pg_temp.fake_email(id) WHERE email IS NOT NULL AND NOT pg_temp.keep(email);
UPDATE account_holder SET email = pg_temp.fake_email(id) WHERE email IS NOT NULL AND NOT pg_temp.keep(email);

UPDATE customer_address
   SET phone = CASE WHEN phone IS NULL THEN NULL ELSE pg_temp.fake_phone() END,
       address_1 = CASE WHEN address_1 IS NULL THEN NULL ELSE 'Test Street' END,
       address_2 = NULL;
UPDATE cart_address
   SET phone = CASE WHEN phone IS NULL THEN NULL ELSE pg_temp.fake_phone() END,
       address_1 = CASE WHEN address_1 IS NULL THEN NULL ELSE 'Test Street' END,
       address_2 = NULL;
UPDATE order_address
   SET phone = CASE WHEN phone IS NULL THEN NULL ELSE pg_temp.fake_phone() END,
       address_1 = CASE WHEN address_1 IS NULL THEN NULL ELSE 'Test Street' END,
       address_2 = NULL;
UPDATE fulfillment_address
   SET phone = CASE WHEN phone IS NULL THEN NULL ELSE pg_temp.fake_phone() END;

-- ── Sellers, team members, applications ─────────────────────────────────────
UPDATE seller
   SET email = pg_temp.fake_email(id),
       phone = CASE WHEN phone IS NULL THEN NULL ELSE pg_temp.fake_phone() END,
       bank_name = CASE WHEN bank_name IS NULL THEN NULL ELSE 'TEST BANK' END,
       account_number = CASE WHEN account_number IS NULL THEN NULL ELSE '0000000000' END,
       account_name = CASE WHEN account_name IS NULL THEN NULL ELSE 'TEST ACCOUNT' END,
       beneficiary_bank_address = NULL,
       dft_bank_name = CASE WHEN dft_bank_name IS NULL THEN NULL ELSE 'TEST BANK' END,
       dft_bank_code = NULL,
       dft_bank_address = NULL,
       dft_account_number = CASE WHEN dft_account_number IS NULL THEN NULL ELSE '0000000000' END
 WHERE NOT pg_temp.keep(email);

UPDATE member
   SET email = pg_temp.fake_email(id),
       phone = CASE WHEN phone IS NULL THEN NULL ELSE pg_temp.fake_phone() END
 WHERE NOT pg_temp.keep(email);

UPDATE stock_location_address
   SET phone = CASE WHEN phone IS NULL THEN NULL ELSE pg_temp.fake_phone() END;

UPDATE seller_application
   SET email = pg_temp.fake_email(id),
       business_email = CASE WHEN business_email IS NULL THEN NULL ELSE pg_temp.fake_email(id || '-biz') END,
       signatory_email = CASE WHEN signatory_email IS NULL THEN NULL ELSE pg_temp.fake_email(id || '-sig') END,
       mobile_number = CASE WHEN mobile_number IS NULL THEN NULL ELSE pg_temp.fake_phone() END,
       business_mobile = CASE WHEN business_mobile IS NULL THEN NULL ELSE pg_temp.fake_phone() END,
       signatory_mobile = CASE WHEN signatory_mobile IS NULL THEN NULL ELSE pg_temp.fake_phone() END,
       business_tin = CASE WHEN business_tin IS NULL THEN NULL ELSE '000-000-000-000' END,
       beneficiary_bank = CASE WHEN beneficiary_bank IS NULL THEN NULL ELSE 'TEST BANK' END,
       bank_address = NULL,
       bank_account_name = CASE WHEN bank_account_name IS NULL THEN NULL ELSE 'TEST ACCOUNT' END,
       bank_account_number = CASE WHEN bank_account_number IS NULL THEN NULL ELSE '0000000000' END
 WHERE NOT pg_temp.keep(email);

-- ── Logins ──────────────────────────────────────────────────────────────────
-- Password logins are keyed by email. Rewrite them for customers and sellers
-- (never admins) so a reset request for a real address finds nobody.
UPDATE provider_identity p
   SET entity_id = pg_temp.fake_email(p.id)
  FROM auth_identity a
 WHERE a.id = p.auth_identity_id
   AND p.provider = 'emailpass'
   AND NOT (coalesce(a.app_metadata, '{}'::jsonb) ? 'user_id')
   AND NOT pg_temp.keep(p.entity_id);

-- Google logins carry the person's email, name and photo in user_metadata
UPDATE provider_identity p
   SET user_metadata = NULL
  FROM auth_identity a
 WHERE a.id = p.auth_identity_id
   AND p.provider = 'google'
   AND NOT (coalesce(a.app_metadata, '{}'::jsonb) ? 'user_id')
   AND NOT pg_temp.keep(p.user_metadata->>'email');

-- Pending invites hold real addresses and working tokens
DELETE FROM invite;
DELETE FROM member_invite;

-- Sent-email history (recipients and contents)
DELETE FROM notification;

-- ── Payments and couriers ───────────────────────────────────────────────────
UPDATE giyapay_config SET sandbox_mode = true;
UPDATE giyapay_subscription_config SET sandbox_mode = true;

UPDATE platform_shipping_provider SET is_active = false;
DELETE FROM seller_shipping_credential;
DELETE FROM vendor_shipping_credential;

-- ── What is left that could reach a real person ─────────────────────────────
SELECT 'customers with real email' AS check, count(*) FROM customer WHERE email NOT LIKE 'delivered+%@resend.dev' AND NOT pg_temp.keep(email)
UNION ALL SELECT 'sellers with real email', count(*) FROM seller WHERE email NOT LIKE 'delivered+%@resend.dev' AND NOT pg_temp.keep(email)
UNION ALL SELECT 'orders with real email', count(*) FROM "order" WHERE email NOT LIKE 'delivered+%@resend.dev' AND NOT pg_temp.keep(email)
UNION ALL SELECT 'active couriers', count(*) FROM platform_shipping_provider WHERE is_active
UNION ALL SELECT 'live GiyaPay configs', (SELECT count(*) FROM giyapay_config WHERE NOT sandbox_mode) + (SELECT count(*) FROM giyapay_subscription_config WHERE NOT sandbox_mode);
