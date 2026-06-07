-- migrate:up

create table users (
    id uuid primary key,
    email text unique not null,
    password_hash text not null,
    created_at timestamp not null default now()
);


GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE users
TO note_app_db_user;

-- migrate:down

drop table users;