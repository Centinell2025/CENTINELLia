-- CENTINELLia Enterprise | PostgreSQL foundation | © 2026 Beacon of the Eagle LLC
-- Run as migration owner, never as the application login.
BEGIN;
CREATE SCHEMA IF NOT EXISTS centinell;
CREATE TABLE centinell.organizations(id uuid PRIMARY KEY, name text NOT NULL CHECK(length(name) BETWEEN 1 AND 200));
CREATE TABLE centinell.assets(
 tenant_id uuid NOT NULL REFERENCES centinell.organizations(id), id uuid NOT NULL,
 name text NOT NULL, platform text NOT NULL, criticality smallint NOT NULL CHECK(criticality BETWEEN 0 AND 4),
 PRIMARY KEY(tenant_id,id));
CREATE TABLE centinell.events(
 tenant_id uuid NOT NULL REFERENCES centinell.organizations(id), occurred_at timestamptz NOT NULL,
 id uuid NOT NULL, asset_id uuid, severity smallint NOT NULL CHECK(severity BETWEEN 0 AND 4),
 source text NOT NULL CHECK(length(source) BETWEEN 1 AND 200), kind text NOT NULL CHECK(length(kind) BETWEEN 1 AND 200),
 attributes jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(attributes)='object' AND octet_length(attributes::text)<=65536),
 received_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,occurred_at,id),
 FOREIGN KEY(tenant_id,asset_id) REFERENCES centinell.assets(tenant_id,id)
) PARTITION BY RANGE(occurred_at);
CREATE INDEX events_tenant_severity_time ON centinell.events(tenant_id,severity,occurred_at DESC,id);
CREATE INDEX events_tenant_asset_time ON centinell.events(tenant_id,asset_id,occurred_at DESC);
CREATE TABLE centinell.assessments(
 tenant_id uuid NOT NULL REFERENCES centinell.organizations(id), id uuid NOT NULL,
 title text NOT NULL, authorization_ref text NOT NULL CHECK(length(trim(authorization_ref))>0),
 scope text NOT NULL CHECK(length(trim(scope))>0), expires_at timestamptz NOT NULL,
 status text NOT NULL CHECK(status IN ('planned','approved','closed')),
 PRIMARY KEY(tenant_id,id));
CREATE TABLE centinell.findings(
 tenant_id uuid NOT NULL, id uuid NOT NULL, assessment_id uuid NOT NULL,
 asset_id uuid, severity smallint NOT NULL CHECK(severity BETWEEN 0 AND 4),
 title text NOT NULL, evidence_ref text NOT NULL, remediation text NOT NULL,
 status text NOT NULL CHECK(status IN ('unverified','confirmed','remediated','accepted')),
 PRIMARY KEY(tenant_id,id),
 FOREIGN KEY(tenant_id,assessment_id) REFERENCES centinell.assessments(tenant_id,id),
 FOREIGN KEY(tenant_id,asset_id) REFERENCES centinell.assets(tenant_id,id));
CREATE TABLE centinell.audit_events(
 tenant_id uuid NOT NULL REFERENCES centinell.organizations(id), id uuid NOT NULL,
 actor_id text NOT NULL, action text NOT NULL, target_ref text NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(tenant_id,id));
-- Set tenant only from verified identity in a trusted API transaction.
-- Custom session variables are not authentication; never expose SQL to clients.
DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['assets','events','assessments','findings','audit_events'] LOOP
  EXECUTE format('ALTER TABLE centinell.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE centinell.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY tenant_isolation ON centinell.%I USING (tenant_id = nullif(current_setting(''centinell.tenant_id'',true),'''')::uuid) WITH CHECK (tenant_id = nullif(current_setting(''centinell.tenant_id'',true),'''')::uuid)',t);
 END LOOP;
END $$;
ALTER TABLE centinell.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE centinell.organizations FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON centinell.organizations USING(id=nullif(current_setting('centinell.tenant_id',true),'')::uuid);
-- Monthly partitions must exist before ingestion; fail closed for out-of-range data.
DO $$
DECLARE i int; a date; b date;
BEGIN
 FOR i IN -1..3 LOOP
  a := (date_trunc('month',current_timestamp AT TIME ZONE 'UTC') + make_interval(months=>i))::date;
  b := (a + interval '1 month')::date;
  EXECUTE format('CREATE TABLE centinell.events_%s PARTITION OF centinell.events FOR VALUES FROM (%L) TO (%L)',to_char(a,'YYYYMM'),a::text||'T00:00:00Z',b::text||'T00:00:00Z');
 END LOOP;
END $$;
REVOKE ALL ON SCHEMA centinell FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA centinell FROM PUBLIC;
COMMIT;
