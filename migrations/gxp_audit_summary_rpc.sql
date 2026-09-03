-- GxP Substitution Audit Summary RPC
-- Provides a single GROUP BY aggregate query for the audit trail summary cards
-- (total events, accepted count, mapping changes count) over a filtered range.

CREATE OR REPLACE FUNCTION public.gxp_get_substitution_summary(
  p_from TIMESTAMPTZ,
  p_to   TIMESTAMPTZ,
  p_drug_code VARCHAR DEFAULT NULL,
  p_user      VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  event_type VARCHAR,
  cnt        BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    als.event_type::VARCHAR,
    COUNT(*)::BIGINT
  FROM public.audit_log_substitution als
  WHERE
    als.performed_at >= p_from
    AND als.performed_at <= p_to
    AND (
      p_drug_code IS NULL OR p_drug_code = '' OR
      als.original_drug_code  ILIKE '%' || p_drug_code || '%' OR
      als.generic_code         ILIKE '%' || p_drug_code || '%' OR
      als.final_drug_code      ILIKE '%' || p_drug_code || '%' OR
      als.suggested_drug_code  ILIKE '%' || p_drug_code || '%'
    )
    AND (
      p_user IS NULL OR p_user = '' OR
      als.performed_by ILIKE '%' || p_user || '%'
    )
  GROUP BY als.event_type;
END;
$$;

-- Lock down: revoke default PUBLIC execute, grant only to authenticated role
REVOKE EXECUTE ON FUNCTION public.gxp_get_substitution_summary FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.gxp_get_substitution_summary TO   authenticated;
