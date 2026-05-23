-- Zero-data-loss verification for the k6 surge run. Run AFTER load/surge.js
-- completes. Requires the test run to have logged the unique
-- signature_hashes it emitted to a known file or table; here we use the
-- simplest pattern: assume the test run targets a fresh schema and just
-- count invoices, students_paid registrations, and surge_queue_tokens.
--
-- Reference assertions (per S07 plan R-5):
--   * COUNT(*) FROM invoices >= unique signatures from k6
--   * COUNT(*) FROM surge_queue_tokens WHERE fulfilled_at IS NULL = 0
--   * COUNT(*) FROM invoices WHERE payment_status = 'PENDING' = invoices count
--     (no PAID flips in load test — webhook not simulated)

\echo '--- surge verification ---'

SELECT
  COUNT(*)                                   AS total_invoices,
  COUNT(DISTINCT signature_hash)             AS unique_signatures,
  COUNT(*) FILTER (WHERE payment_status = 'PENDING') AS pending,
  COUNT(*) FILTER (WHERE qpay_invoice_id IS NOT NULL) AS with_qpay_id
FROM invoices
WHERE created_at > NOW() - interval '90 minutes';

SELECT
  COUNT(*)                                         AS total_tokens,
  COUNT(*) FILTER (WHERE fulfilled_at IS NULL)     AS unfulfilled,
  COUNT(*) FILTER (WHERE fulfilled_at IS NOT NULL) AS fulfilled
FROM surge_queue_tokens
WHERE enqueued_at > NOW() - interval '90 minutes';

\echo 'PASS criteria: unfulfilled = 0 AND total_invoices = unique_signatures'
