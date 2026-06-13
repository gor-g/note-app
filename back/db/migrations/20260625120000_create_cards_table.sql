-- migrate:up

create table cards (
    -- The card id is generated client-side (a UUID), so the server stores the
    -- id it's given rather than generating its own.
    id uuid primary key,
    user_id uuid not null references users(id) on delete cascade,
    -- Opaque client-encrypted blob (base64 AES-GCM). The server never decrypts
    -- it. Null for a tombstone — a deleted card kept around so other devices
    -- learn of the deletion on their next sync.
    ciphertext text,
    deleted boolean not null default false,
    -- Server-stamped on every write. This is the cursor sync uses to fetch
    -- "everything that changed since last time".
    updated_at timestamptz not null default now()
);

-- Sync reads a user's rows changed since a cursor, in updated_at order.
create index idx_cards_user_updated on cards (user_id, updated_at);

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE cards
TO note_app_db_user;

-- migrate:down

drop table cards;
