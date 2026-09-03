-- Create GxP Audit Log Table
CREATE TABLE IF NOT EXISTS public.audit_log_substitution (
  log_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('SUGGESTED', 'ACCEPTED', 'REJECTED', 'MAPPING_CHANGED')),
  sale_transaction_id VARCHAR(50),
  original_drug_code VARCHAR(20) NOT NULL,
  suggested_drug_code VARCHAR(20),
  final_drug_code VARCHAR(20) NOT NULL, -- For MAPPING_CHANGED events this equals original_drug_code (no sale involved)
  generic_code VARCHAR(20) NOT NULL,
  old_value VARCHAR(100),
  new_value VARCHAR(100),
  remarks VARCHAR(250),
  performed_by VARCHAR(50) NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_or_terminal_id VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_audit_log_sub_performed_at ON public.audit_log_substitution (performed_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_sub_original_drug ON public.audit_log_substitution (original_drug_code);
CREATE INDEX IF NOT EXISTS idx_audit_log_sub_sale_txn ON public.audit_log_substitution (sale_transaction_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_sub_generic ON public.audit_log_substitution (generic_code);

-- Insert-only enforcement
CREATE OR REPLACE FUNCTION protect_audit_log_substitution()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Updates and Deletes are not permitted on the audit_log_substitution table (GxP compliance).';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_audit_log_substitution ON public.audit_log_substitution;
CREATE TRIGGER trg_protect_audit_log_substitution
BEFORE UPDATE OR DELETE ON public.audit_log_substitution
FOR EACH ROW EXECUTE FUNCTION protect_audit_log_substitution();

-- Lock down the table itself: no direct writes, only through SECURITY DEFINER RPCs below
REVOKE ALL ON public.audit_log_substitution FROM authenticated;
GRANT SELECT ON public.audit_log_substitution TO authenticated;

-- Trigger to automatically log mapping changes on pharmacy_drug_master edits
CREATE OR REPLACE FUNCTION trg_audit_drug_mapping_change()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old_generic_code VARCHAR(20);
  v_new_generic_code VARCHAR(20);
  v_old_generic_desc VARCHAR(100);
  v_new_generic_desc VARCHAR(100);
  v_final_generic_code VARCHAR(20);
  v_performed_by VARCHAR(50);
BEGIN
  v_performed_by := nullif(current_setting('app.current_user_id', true), '');
  IF v_performed_by IS NULL THEN
    RAISE EXCEPTION 'app.current_user_id session variable not set — cannot attribute this change (GxP compliance).';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.generic_id IS NOT NULL THEN
      SELECT generic_code, generic_name || ' (' || COALESCE(strength, '') || ' ' || COALESCE(strength_unit, '') || ')'
      INTO v_new_generic_code, v_new_generic_desc
      FROM public.pharmacy_drug_generics
      WHERE id = NEW.generic_id;

      INSERT INTO public.audit_log_substitution (
        event_type, sale_transaction_id, original_drug_code, suggested_drug_code,
        final_drug_code, generic_code, old_value, new_value, remarks,
        performed_by, performed_at
      ) VALUES (
        'MAPPING_CHANGED', NULL, NEW.item_code, NULL,
        NEW.item_code, COALESCE(v_new_generic_code, 'UNMAPPED'), NULL, v_new_generic_desc,
        'Mapping created', v_performed_by, now()
      );
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.generic_id IS DISTINCT FROM NEW.generic_id OR COALESCE(OLD.is_active, true) IS DISTINCT FROM COALESCE(NEW.is_active, true) THEN
      IF OLD.generic_id IS NOT NULL THEN
        SELECT generic_code, generic_name || ' (' || COALESCE(strength, '') || ' ' || COALESCE(strength_unit, '') || ')'
        INTO v_old_generic_code, v_old_generic_desc
        FROM public.pharmacy_drug_generics
        WHERE id = OLD.generic_id;
      END IF;

      IF NEW.generic_id IS NOT NULL THEN
        SELECT generic_code, generic_name || ' (' || COALESCE(strength, '') || ' ' || COALESCE(strength_unit, '') || ')'
        INTO v_new_generic_code, v_new_generic_desc
        FROM public.pharmacy_drug_generics
        WHERE id = NEW.generic_id;
      END IF;

      v_final_generic_code := COALESCE(v_new_generic_code, v_old_generic_code, 'UNMAPPED');

      INSERT INTO public.audit_log_substitution (
        event_type, sale_transaction_id, original_drug_code, suggested_drug_code,
        final_drug_code, generic_code, old_value, new_value, remarks,
        performed_by, performed_at
      ) VALUES (
        'MAPPING_CHANGED', NULL, NEW.item_code, NULL,
        NEW.item_code, v_final_generic_code, v_old_generic_desc, v_new_generic_desc,
        CASE WHEN COALESCE(OLD.is_active, true) IS DISTINCT FROM COALESCE(NEW.is_active, true) AND NOT COALESCE(NEW.is_active, true)
             THEN 'Drug deactivated' ELSE 'Mapping updated' END,
        v_performed_by, now()
      );
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.generic_id IS NOT NULL THEN
      SELECT generic_code, generic_name || ' (' || COALESCE(strength, '') || ' ' || COALESCE(strength_unit, '') || ')'
      INTO v_old_generic_code, v_old_generic_desc
      FROM public.pharmacy_drug_generics
      WHERE id = OLD.generic_id;

      INSERT INTO public.audit_log_substitution (
        event_type, sale_transaction_id, original_drug_code, suggested_drug_code,
        final_drug_code, generic_code, old_value, new_value, remarks,
        performed_by, performed_at
      ) VALUES (
        'MAPPING_CHANGED', NULL, OLD.item_code, NULL,
        OLD.item_code, COALESCE(v_old_generic_code, 'UNMAPPED'), v_old_generic_desc, NULL,
        'Mapping removed', v_performed_by, now()
      );
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_drug_mapping_change ON public.pharmacy_drug_master;
CREATE TRIGGER trg_audit_drug_mapping_change
AFTER INSERT OR UPDATE OR DELETE ON public.pharmacy_drug_master
FOR EACH ROW EXECUTE FUNCTION trg_audit_drug_mapping_change();

-- --- GxP Transactional RPC Handlers ---

CREATE OR REPLACE FUNCTION public.gxp_save_drug_master(
  p_user_id VARCHAR,
  p_id UUID,
  p_item_id UUID,
  p_item_code VARCHAR,
  p_drug_name VARCHAR,
  p_generic_id UUID,
  p_is_active BOOLEAN,
  p_dosage_form VARCHAR,
  p_pack_size NUMERIC,
  p_pack_unit VARCHAR,
  p_substitutable BOOLEAN,
  p_margin_percent NUMERIC,
  p_cost_price NUMERIC
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'No user identity provided — cannot attribute this change.';
  END IF;
  PERFORM set_config('app.current_user_id', p_user_id, true);

  INSERT INTO public.pharmacy_drug_master (
    id, item_id, item_code, drug_name, generic_id, is_active,
    dosage_form, pack_size, pack_unit, substitutable, margin_percent, cost_price
  ) VALUES (
    COALESCE(p_id, gen_random_uuid()), p_item_id, p_item_code, p_drug_name, p_generic_id, p_is_active,
    p_dosage_form, p_pack_size, p_pack_unit, p_substitutable, p_margin_percent, p_cost_price
  )
  ON CONFLICT (id) DO UPDATE SET
    item_id = EXCLUDED.item_id,
    item_code = EXCLUDED.item_code,
    drug_name = EXCLUDED.drug_name,
    generic_id = EXCLUDED.generic_id,
    is_active = EXCLUDED.is_active,
    dosage_form = EXCLUDED.dosage_form,
    pack_size = EXCLUDED.pack_size,
    pack_unit = EXCLUDED.pack_unit,
    substitutable = EXCLUDED.substitutable,
    margin_percent = EXCLUDED.margin_percent,
    cost_price = EXCLUDED.cost_price;

  RETURN TRUE;
END;
$$;

-- Soft-delete
CREATE OR REPLACE FUNCTION public.gxp_delete_drug_master(
  p_user_id VARCHAR,
  p_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'No user identity provided — cannot attribute this change.';
  END IF;
  PERFORM set_config('app.current_user_id', p_user_id, true);

  UPDATE public.pharmacy_drug_master SET is_active = false WHERE id = p_id;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.gxp_log_substitutions(
  p_user_id VARCHAR,
  p_ip_or_terminal VARCHAR,
  p_logs JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_log RECORD;
  v_orig_drug_code VARCHAR(20);
  v_final_drug_code VARCHAR(20);
  v_generic_code VARCHAR(20);
  v_alt_id UUID;
  v_alt_code VARCHAR(20);
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'No user identity provided — cannot attribute this change.';
  END IF;
  PERFORM set_config('app.current_user_id', p_user_id, true);

  FOR v_log IN SELECT * FROM jsonb_to_recordset(p_logs) AS x(
    sale_transaction_id VARCHAR,
    original_drug_id UUID,
    suggested_drug_ids UUID[],
    switched_to_drug_id UUID,
    action VARCHAR,
    remarks VARCHAR
  ) LOOP

    SELECT dm.item_code, dg.generic_code
    INTO v_orig_drug_code, v_generic_code
    FROM public.pharmacy_drug_master dm
    JOIN public.pharmacy_drug_generics dg ON dg.id = dm.generic_id
    WHERE dm.item_id = v_log.original_drug_id;

    IF v_orig_drug_code IS NULL THEN
      RAISE EXCEPTION 'Original drug ID % not found in master mapping.', v_log.original_drug_id;
    END IF;

    IF v_log.suggested_drug_ids IS NOT NULL THEN
      FOR v_alt_id IN SELECT unnest(v_log.suggested_drug_ids) LOOP
        SELECT item_code INTO v_alt_code
        FROM public.pharmacy_drug_master
        WHERE item_id = v_alt_id;

        IF v_alt_code IS NOT NULL THEN
          INSERT INTO public.audit_log_substitution (
            event_type, sale_transaction_id, original_drug_code, suggested_drug_code,
            final_drug_code, generic_code, old_value, new_value, remarks,
            performed_by, performed_at, ip_or_terminal_id
          ) VALUES (
            'SUGGESTED', v_log.sale_transaction_id, v_orig_drug_code, v_alt_code,
            v_orig_drug_code, v_generic_code, NULL, NULL, NULL,
            p_user_id, now(), p_ip_or_terminal
          );
        END IF;
      END LOOP;
    END IF;

    IF v_log.action = 'switched' THEN
      SELECT item_code INTO v_final_drug_code
      FROM public.pharmacy_drug_master
      WHERE item_id = v_log.switched_to_drug_id;

      IF v_final_drug_code IS NULL THEN
        RAISE EXCEPTION 'Switched to drug ID % not found in master.', v_log.switched_to_drug_id;
      END IF;

      INSERT INTO public.audit_log_substitution (
        event_type, sale_transaction_id, original_drug_code, suggested_drug_code,
        final_drug_code, generic_code, old_value, new_value, remarks,
        performed_by, performed_at, ip_or_terminal_id
      ) VALUES (
        'ACCEPTED', v_log.sale_transaction_id, v_orig_drug_code, v_final_drug_code,
        v_final_drug_code, v_generic_code, NULL, NULL, v_log.remarks,
        p_user_id, now(), p_ip_or_terminal
      );
    ELSE
      INSERT INTO public.audit_log_substitution (
        event_type, sale_transaction_id, original_drug_code, suggested_drug_code,
        final_drug_code, generic_code, old_value, new_value, remarks,
        performed_by, performed_at, ip_or_terminal_id
      ) VALUES (
        'REJECTED', v_log.sale_transaction_id, v_orig_drug_code, NULL,
        v_orig_drug_code, v_generic_code, NULL, NULL, v_log.remarks,
        p_user_id, now(), p_ip_or_terminal
      );
    END IF;

  END LOOP;

  RETURN TRUE;
END;
$$;

-- Lock down execute privileges
REVOKE EXECUTE ON FUNCTION public.gxp_save_drug_master(VARCHAR, UUID, UUID, VARCHAR, VARCHAR, UUID, BOOLEAN, VARCHAR, NUMERIC, VARCHAR, BOOLEAN, NUMERIC, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gxp_delete_drug_master(VARCHAR, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gxp_log_substitutions(VARCHAR, VARCHAR, JSONB) FROM PUBLIC, anon, authenticated;
