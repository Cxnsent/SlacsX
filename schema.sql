-- Schema definition for SlacsX CRM & Project Management Tool
-- Extensions
create extension if not exists "uuid-ossp";

-- Kanzleien table
create table if not exists public.kanzleien (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    ansprechpartner text,
    allgemeine_infos text,
    created_at timestamptz not null default timezone('utc', now())
);

-- Sachbearbeiter table
create table if not exists public.sachbearbeiter (
    id uuid primary key default uuid_generate_v4(),
    kanzlei_id uuid not null references public.kanzleien(id) on delete cascade,
    name text not null,
    email text,
    telefon text,
    created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_sachbearbeiter_kanzlei_id on public.sachbearbeiter(kanzlei_id);

-- Enum types
do $$
begin
    if not exists (select 1 from pg_type where typname = 'projekt_typ_enum') then
        create type projekt_typ_enum as enum ('Selbstbucher', 'Auftragsbuchhaltung');
    end if;
end $$;

-- Projekte table
create table if not exists public.projekte (
    id uuid primary key default uuid_generate_v4(),
    titel text not null,
    kanzlei_id uuid references public.kanzleien(id) on delete set null,
    projekt_typ projekt_typ_enum,
    bucket text not null,
    status text not null default 'Nicht begonnen',
    prioritaet text not null default 'Mittel',
    start_datum date,
    faelligkeits_datum date,
    notizen text,
    metadaten jsonb default '{}'::jsonb,
    checkliste jsonb default '[]'::jsonb,
    created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_projekte_kanzlei_id on public.projekte(kanzlei_id);
create index if not exists idx_projekte_bucket on public.projekte(bucket);
create index if not exists idx_projekte_faelligkeits_datum on public.projekte(faelligkeits_datum);

-- Dokumente table
create table if not exists public.dokumente (
    id uuid primary key default uuid_generate_v4(),
    projekt_id uuid references public.projekte(id) on delete cascade,
    file_name text not null,
    storage_path text not null,
    uploaded_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_dokumente_projekt_id on public.dokumente(projekt_id);

-- Vorlagen table
create table if not exists public.vorlagen (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    betreff text,
    inhalt text
);

-- Comments table for collaboration
create table if not exists public.kommentare (
    id uuid primary key default uuid_generate_v4(),
    projekt_id uuid not null references public.projekte(id) on delete cascade,
    author_id uuid references auth.users(id) on delete set null,
    nachricht text not null,
    created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_kommentare_projekt_id on public.kommentare(projekt_id);

-- Audit log for workflow automation
create table if not exists public.workflow_logs (
    id uuid primary key default uuid_generate_v4(),
    projekt_id uuid not null references public.projekte(id) on delete cascade,
    aktion text not null,
    details jsonb,
    created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_workflow_logs_projekt_id on public.workflow_logs(projekt_id);

-- Materialized view placeholder for dashboard analytics
create materialized view if not exists public.dashboard_summary as
select
    k.id as kanzlei_id,
    k.name as kanzlei_name,
    count(p.id) as projektanzahl,
    avg((p.faelligkeits_datum - p.start_datum)) as durchschnittliche_dauer
from public.kanzleien k
left join public.projekte p on p.kanzlei_id = k.id
where p.start_datum is not null and p.faelligkeits_datum is not null
group by k.id, k.name;

create index if not exists idx_dashboard_summary_kanzlei_id on public.dashboard_summary(kanzlei_id);
