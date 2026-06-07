-- migrate:up

create table users (
    id uuid primary key,
    email text unique not null,
    password_hash text not null,
    created_at timestamp not null default now()
);

-- migrate:down

drop table users;