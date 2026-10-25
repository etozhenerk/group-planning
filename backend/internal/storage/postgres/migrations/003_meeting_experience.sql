CREATE TABLE message_reactions (
    meeting_id text NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    entry_id text NOT NULL REFERENCES feed_entries(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    emoji text NOT NULL,
    document jsonb NOT NULL,
    PRIMARY KEY(entry_id,user_id,emoji)
);
CREATE INDEX message_reactions_meeting ON message_reactions(meeting_id);

CREATE TABLE meeting_media (
    id text PRIMARY KEY,
    meeting_id text NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    document jsonb NOT NULL
);
CREATE INDEX meeting_media_meeting ON meeting_media(meeting_id);
CREATE TABLE media_blobs (
    key text PRIMARY KEY,
    media_id text NOT NULL REFERENCES meeting_media(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    content bytea NOT NULL CHECK(octet_length(content) <= 20971520)
);
