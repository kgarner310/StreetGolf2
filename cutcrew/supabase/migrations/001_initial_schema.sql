-- ============================================================
-- CutCrew Initial Schema
-- Run against a Supabase project via: supabase db push
-- or paste into the Supabase SQL editor
-- ============================================================

-- Custom types
CREATE TYPE user_role AS ENUM ('customer', 'provider');
CREATE TYPE job_status AS ENUM ('open', 'bidding', 'contracted', 'in_progress', 'completed', 'disputed', 'cancelled');
CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE payment_status AS ENUM ('pending', 'escrowed', 'released', 'refunded', 'disputed');
CREATE TYPE property_type AS ENUM ('residential', 'commercial');

-- ============================================================
-- profiles — extends auth.users
-- ============================================================
CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       user_role NOT NULL,
  full_name  text NOT NULL,
  phone      text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger: auto-create profile on auth signup is handled in application code

-- ============================================================
-- provider_profiles — extra details for providers
-- ============================================================
CREATE TABLE provider_profiles (
  id                  uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  business_name       text NOT NULL,
  business_address    text,
  service_zip_codes   text[] NOT NULL DEFAULT '{}',
  stripe_account_id   text,
  is_verified         boolean NOT NULL DEFAULT false,
  bio                 text,
  years_experience    int,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage own profile"
  ON provider_profiles FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "Customers can read verified providers"
  ON provider_profiles FOR SELECT
  USING (is_verified = true OR auth.uid() = id);

-- ============================================================
-- insurance_certificates — COI management
-- ============================================================
CREATE TABLE insurance_certificates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id      uuid NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  document_url     text NOT NULL,
  insurer_name     text NOT NULL,
  policy_number    text NOT NULL,
  coverage_amount  numeric(12,2) NOT NULL,
  expiry_date      date NOT NULL,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE insurance_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers own their COI records"
  ON insurance_certificates FOR ALL
  USING (auth.uid() = provider_id);

-- ============================================================
-- properties — customer properties
-- ============================================================
CREATE TABLE properties (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nickname        text,
  address         text NOT NULL,
  city            text NOT NULL,
  state           text NOT NULL,
  zip_code        text NOT NULL,
  property_type   property_type NOT NULL DEFAULT 'residential',
  lot_size_sqft   int,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers own their properties"
  ON properties FOR ALL
  USING (auth.uid() = customer_id);

-- ============================================================
-- jobs — core job postings
-- ============================================================
CREATE TABLE jobs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id       uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  customer_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  services          text[] NOT NULL,   -- ['mowing','weed_eating','edging','blowing']
  status            job_status NOT NULL DEFAULT 'open',
  preferred_date    date,
  description       text,
  customer_budget   numeric(10,2),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers own their jobs"
  ON jobs FOR ALL
  USING (auth.uid() = customer_id);

CREATE POLICY "Providers can read open/bidding jobs"
  ON jobs FOR SELECT
  USING (
    status IN ('open', 'bidding')
    OR auth.uid() IN (
      SELECT provider_id FROM bids WHERE job_id = jobs.id
    )
    OR auth.uid() = customer_id
  );

CREATE INDEX jobs_status_idx ON jobs(status);
CREATE INDEX jobs_customer_idx ON jobs(customer_id);

-- ============================================================
-- bids — provider quotes
-- ============================================================
CREATE TABLE bids (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                   uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  provider_id              uuid NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  amount                   numeric(10,2) NOT NULL,
  estimated_duration_hours numeric(4,2),
  notes                    text,
  status                   bid_status NOT NULL DEFAULT 'pending',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, provider_id)
);

ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage their own bids"
  ON bids FOR ALL
  USING (auth.uid() = provider_id);

CREATE POLICY "Customers read bids on their jobs"
  ON bids FOR SELECT
  USING (
    auth.uid() IN (SELECT customer_id FROM jobs WHERE id = bids.job_id)
  );

CREATE INDEX bids_job_idx ON bids(job_id);
CREATE INDEX bids_provider_idx ON bids(provider_id);

-- ============================================================
-- contracts — one per accepted bid
-- ============================================================
CREATE TABLE contracts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id               uuid NOT NULL REFERENCES jobs(id),
  bid_id               uuid NOT NULL REFERENCES bids(id),
  customer_id          uuid NOT NULL REFERENCES profiles(id),
  provider_id          uuid NOT NULL REFERENCES provider_profiles(id),
  total_amount         numeric(10,2) NOT NULL,   -- bid amount
  provider_payout      numeric(10,2) NOT NULL,   -- total * 0.92
  customer_total       numeric(10,2) NOT NULL,   -- total * 1.04
  platform_fee         numeric(10,2) NOT NULL,   -- total * 0.12
  service_details      jsonb NOT NULL,
  terms_hash           text NOT NULL,
  customer_signed_at   timestamptz,
  customer_ip          text,
  provider_signed_at   timestamptz,
  provider_ip          text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties read their own contracts"
  ON contracts FOR SELECT
  USING (auth.uid() = customer_id OR auth.uid() = provider_id);

CREATE POLICY "System can insert contracts"
  ON contracts FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Prevent alteration of signed contracts: signatures are set once
CREATE POLICY "Parties can update only their own signature"
  ON contracts FOR UPDATE
  USING (
    (auth.uid() = customer_id AND customer_signed_at IS NULL)
    OR (auth.uid() = provider_id AND provider_signed_at IS NULL)
  );

-- ============================================================
-- payments — escrow & payouts
-- ============================================================
CREATE TABLE payments (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id               uuid NOT NULL REFERENCES contracts(id),
  stripe_payment_intent_id  text,
  stripe_transfer_id        text,
  customer_charged          numeric(10,2) NOT NULL,
  provider_payout           numeric(10,2) NOT NULL,
  platform_fee              numeric(10,2) NOT NULL,
  status                    payment_status NOT NULL DEFAULT 'pending',
  created_at                timestamptz NOT NULL DEFAULT now(),
  released_at               timestamptz
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Neither party should be able to read the other's financial details directly;
-- they see only their own contract's payment status via the contract join
CREATE POLICY "Customer reads own payment status"
  ON payments FOR SELECT
  USING (
    auth.uid() IN (SELECT customer_id FROM contracts WHERE id = payments.contract_id)
  );

CREATE POLICY "Provider reads own payment status"
  ON payments FOR SELECT
  USING (
    auth.uid() IN (SELECT provider_id FROM contracts WHERE id = payments.contract_id)
  );

-- ============================================================
-- reviews — mutual post-job ratings
-- ============================================================
CREATE TABLE reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       uuid NOT NULL REFERENCES jobs(id),
  reviewer_id  uuid NOT NULL REFERENCES profiles(id),
  reviewee_id  uuid NOT NULL REFERENCES profiles(id),
  rating       int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, reviewer_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviewers write own review"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  USING (true);

-- ============================================================
-- Storage buckets (run after enabling Storage in Supabase)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('coi-documents', 'coi-documents', false);
--
-- CREATE POLICY "Providers upload own COI"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'coi-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Providers read own COI"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'coi-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Helpful view: job board (open jobs with property info)
-- ============================================================
CREATE VIEW open_jobs_view AS
  SELECT
    j.id,
    j.services,
    j.preferred_date,
    j.description,
    j.customer_budget,
    j.created_at,
    p.city,
    p.state,
    p.zip_code,
    p.property_type,
    p.lot_size_sqft,
    COUNT(b.id) AS bid_count
  FROM jobs j
  JOIN properties p ON p.id = j.property_id
  LEFT JOIN bids b ON b.job_id = j.id
  WHERE j.status IN ('open', 'bidding')
  GROUP BY j.id, p.id;
