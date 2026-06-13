-- migrate:up

create table sessions (
    -- We store only a SHA-256 hash of the session token, never the token
    -- itself. The raw token lives solely in the user's HttpOnly cookie, so a
    -- leak of this table cannot be used to impersonate anyone.
    token_hash text primary key,
    user_id uuid not null references users(id) on delete cascade,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
);

create index idx_sessions_user_id on sessions (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE sessions
TO note_app_db_user;

-- migrate:down

drop table sessions;
