-- ============================================================
-- SubRoute B2B Schema
-- Both sides are lawn care businesses.
-- Primary contractors post coverage jobs; fill-in contractors claim them.
-- Client identity is hidden until non-solicitation agreement is signed.
-- ============================================================

CREATE TYPE contractor_role    AS ENUM ('primary', 'fillin', 'both');
CREATE TYPE coverage_status    AS ENUM ('open', 'claimed', 'active', 'completed', 'cancelled', 'disputed');
CREATE TYPE claim_status       AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');
CREATE TYPE payment_status     AS ENUM ('pending', 'escrowed', 'released', 'refunded', 'disputed');
CREATE TYPE property_type      AS ENUM ('residential', 'commercial', 'hoa', 'municipal');
CREATE TYPE agreement_status   AS ENUM ('pending', 'signed');

-- ============================================================
-- contractor_profiles — the only user type (all are businesses)
-- ============================================================
CREATE TABLE contractor_profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name       text NOT NULL,
  owner_name          text NOT NULL,
  phone               text,
  service_zip_codes   text[]    NOT NULL DEFAULT '{}',
  preferred_role      contractor_role NOT NULL DEFAULT 'both',
  stripe_account_id   text,
  is_verified         boolean   NOT NULL DEFAULT false,
  reliability_score   numeric(3,2) DEFAULT 5.00,  -- 1.00–5.00, updated after each job
  years_in_business   int,
  bio                 text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors read own profile"
  ON contractor_profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Contractors read verified peers (limited fields)"
  ON contractor_profiles FOR SELECT USING (is_verified = true);

CREATE POLICY "Contractors update own profile"
  ON contractor_profiles FOR ALL USING (auth.uid() = id);

-- ============================================================
-- insurance_certificates — COI required for both roles
-- ============================================================
CREATE TABLE insurance_certificates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id    uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  document_url     text NOT NULL,
  insurer_name     text NOT NULL,
  policy_number    text NOT NULL,
  coverage_amount  numeric(12,2) NOT NULL,
  expiry_date      date NOT NULL,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE insurance_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors own their COI"
  ON insurance_certificates FOR ALL USING (auth.uid() = contractor_id);

-- ============================================================
-- coverage_jobs — posted by primary contractors
--
-- CLIENT PRIVACY:
--   full_address, gate_code, client_notes are NEVER shown until
--   a signed non_solicitation_agreements row exists for the viewer.
--   The application layer enforces this; the columns exist here.
-- ============================================================
CREATE TABLE coverage_jobs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_id        uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,

  -- Public fields (visible on job board before signing)
  zip_code          text NOT NULL,
  city              text NOT NULL,
  state             text NOT NULL,
  property_type     property_type NOT NULL DEFAULT 'residential',
  property_count    int NOT NULL DEFAULT 1,        -- # of stops in this coverage block
  services          text[] NOT NULL,              -- ['mowing','weed_eating','edging','blowing']
  coverage_date     date NOT NULL,
  time_window       text,                         -- e.g. "7am–12pm"
  estimated_hours   numeric(4,2),
  pay_rate          numeric(10,2) NOT NULL,        -- what primary will pay fill-in (total)
  notes_public      text,                         -- shown before signing (no sensitive info)

  -- Private fields (revealed only after non-solicitation signed)
  full_address      text,
  gate_code         text,
  client_notes      text,                         -- property-specific instructions

  status            coverage_status NOT NULL DEFAULT 'open',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

ALTER TABLE coverage_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Primaries manage own coverage jobs"
  ON coverage_jobs FOR ALL USING (auth.uid() = primary_id);

CREATE POLICY "Verified fill-ins read open jobs (public fields only)"
  ON coverage_jobs FOR SELECT
  USING (status IN ('open', 'claimed') AND auth.uid() != primary_id);

CREATE INDEX coverage_jobs_zip_idx    ON coverage_jobs(zip_code);
CREATE INDEX coverage_jobs_status_idx ON coverage_jobs(status);
CREATE INDEX coverage_jobs_date_idx   ON coverage_jobs(coverage_date);

-- ============================================================
-- coverage_claims — fill-in expresses interest / is approved
-- ============================================================
CREATE TABLE coverage_claims (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       uuid NOT NULL REFERENCES coverage_jobs(id) ON DELETE CASCADE,
  fillin_id    uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  message      text,
  status       claim_status NOT NULL DEFAULT 'pending',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, fillin_id)
);

ALTER TABLE coverage_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fill-ins manage their own claims"
  ON coverage_claims FOR ALL USING (auth.uid() = fillin_id);

CREATE POLICY "Primaries read claims on their jobs"
  ON coverage_claims FOR SELECT
  USING (
    auth.uid() IN (SELECT primary_id FROM coverage_jobs WHERE id = coverage_claims.job_id)
  );

CREATE POLICY "Primaries approve/reject claims on their jobs"
  ON coverage_claims FOR UPDATE
  USING (
    auth.uid() IN (SELECT primary_id FROM coverage_jobs WHERE id = coverage_claims.job_id)
  );

-- ============================================================
-- non_solicitation_agreements
--
-- Signed BEFORE private job details (address, gate code) are revealed.
-- Once signed, application layer returns full_address, gate_code, client_notes.
-- ============================================================
CREATE TABLE non_solicitation_agreements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id         uuid NOT NULL REFERENCES coverage_jobs(id) ON DELETE CASCADE,
  fillin_id      uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  primary_id     uuid NOT NULL REFERENCES contractor_profiles(id),
  terms_text     text NOT NULL,
  terms_hash     text NOT NULL,  -- SHA-256 of terms_text
  signed_at      timestamptz NOT NULL DEFAULT now(),
  fillin_ip      text,
  status         agreement_status NOT NULL DEFAULT 'signed',
  UNIQUE (job_id, fillin_id)
);

ALTER TABLE non_solicitation_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties read their own agreements"
  ON non_solicitation_agreements FOR SELECT
  USING (auth.uid() = fillin_id OR auth.uid() = primary_id);

CREATE POLICY "Fill-ins create agreements"
  ON non_solicitation_agreements FOR INSERT
  WITH CHECK (auth.uid() = fillin_id);

-- ============================================================
-- coverage_contracts — created after primary approves claim + agreement signed
-- ============================================================
CREATE TABLE coverage_contracts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id              uuid NOT NULL REFERENCES coverage_jobs(id),
  claim_id            uuid NOT NULL REFERENCES coverage_claims(id),
  primary_id          uuid NOT NULL REFERENCES contractor_profiles(id),
  fillin_id           uuid NOT NULL REFERENCES contractor_profiles(id),
  agreed_pay          numeric(10,2) NOT NULL,      -- what fill-in receives
  platform_fee        numeric(10,2) NOT NULL,      -- platform keeps (10%)
  primary_total       numeric(10,2) NOT NULL,      -- primary pays (agreed_pay + fee)
  terms_hash          text NOT NULL,
  primary_signed_at   timestamptz,
  fillin_signed_at    timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coverage_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties read their contracts"
  ON coverage_contracts FOR SELECT
  USING (auth.uid() = primary_id OR auth.uid() = fillin_id);

CREATE POLICY "Primary creates contracts"
  ON coverage_contracts FOR INSERT
  WITH CHECK (auth.uid() = primary_id);

CREATE POLICY "Parties sign their side"
  ON coverage_contracts FOR UPDATE
  USING (
    (auth.uid() = primary_id AND primary_signed_at IS NULL)
    OR (auth.uid() = fillin_id AND fillin_signed_at IS NULL)
  );

-- ============================================================
-- payments
-- ============================================================
CREATE TABLE payments (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id               uuid NOT NULL REFERENCES coverage_contracts(id),
  stripe_payment_intent_id  text,
  stripe_transfer_id        text,
  primary_charged           numeric(10,2) NOT NULL,
  fillin_payout             numeric(10,2) NOT NULL,
  platform_fee              numeric(10,2) NOT NULL,
  status                    payment_status NOT NULL DEFAULT 'pending',
  created_at                timestamptz NOT NULL DEFAULT now(),
  released_at               timestamptz
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties read payment status"
  ON payments FOR SELECT
  USING (
    auth.uid() IN (
      SELECT primary_id FROM coverage_contracts WHERE id = payments.contract_id
      UNION
      SELECT fillin_id FROM coverage_contracts WHERE id = payments.contract_id
    )
  );

-- ============================================================
-- reviews — mutual reliability ratings after each job
-- ============================================================
CREATE TABLE reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid NOT NULL REFERENCES coverage_jobs(id),
  reviewer_id   uuid NOT NULL REFERENCES contractor_profiles(id),
  reviewee_id   uuid NOT NULL REFERENCES contractor_profiles(id),
  rating        int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, reviewer_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Reviewers write own review"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- ============================================================
-- Trigger: update reliability_score on new review
-- ============================================================
CREATE OR REPLACE FUNCTION update_reliability_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contractor_profiles
  SET reliability_score = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM reviews
    WHERE reviewee_id = NEW.reviewee_id
  )
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_reliability
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_reliability_score();

-- ============================================================
-- View: open coverage jobs (public fields only — safe to expose)
-- ============================================================
CREATE VIEW open_coverage_view AS
  SELECT
    j.id,
    j.zip_code,
    j.city,
    j.state,
    j.property_type,
    j.property_count,
    j.services,
    j.coverage_date,
    j.time_window,
    j.estimated_hours,
    j.pay_rate,
    j.notes_public,
    j.created_at,
    cp.business_name AS primary_business,
    cp.reliability_score AS primary_score,
    COUNT(cc.id) AS claim_count
  FROM coverage_jobs j
  JOIN contractor_profiles cp ON cp.id = j.primary_id
  LEFT JOIN coverage_claims cc ON cc.job_id = j.id
  WHERE j.status = 'open'
  GROUP BY j.id, cp.id;

-- ============================================================
-- Storage bucket for COI documents (run after enabling Storage)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('subroute-coi', 'subroute-coi', false);
