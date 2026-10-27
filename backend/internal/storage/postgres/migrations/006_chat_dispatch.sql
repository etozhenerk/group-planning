ALTER TABLE realtime_outbox ADD COLUMN lease_id text NOT NULL DEFAULT '';
ALTER TABLE realtime_outbox ADD COLUMN lease_until timestamptz;
ALTER TABLE realtime_outbox ADD CONSTRAINT realtime_outbox_lease_pair CHECK ((lease_id = '') = (lease_until IS NULL));
CREATE INDEX realtime_outbox_dispatched ON realtime_outbox(dispatched_at,id) WHERE dispatched_at IS NOT NULL;
