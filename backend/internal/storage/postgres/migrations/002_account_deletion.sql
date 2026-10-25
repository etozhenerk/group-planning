CREATE TABLE removed_meeting_users (
    user_id text PRIMARY KEY
);

CREATE TABLE identity_deletion_receipts (
    secret_hash text PRIMARY KEY,
    expires_at timestamptz NOT NULL,
    document jsonb NOT NULL
);
CREATE INDEX identity_deletion_receipts_expiry ON identity_deletion_receipts(expires_at);

CREATE TABLE identity_subject_fences (
    subject_hash text PRIMARY KEY,
    deleted_at timestamptz NOT NULL
);
CREATE INDEX identity_subject_fences_expiry ON identity_subject_fences(deleted_at);
