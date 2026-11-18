create table projects (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 owner text not null, purpose text not null, retention_review date not null,
 last_review_reason text, last_reviewed_by text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table mappings (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 definition jsonb not null check(jsonb_typeof(definition)='array'),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table batches (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 project_id uuid not null references projects(id), mapping_id uuid not null references mappings(id),
 source_hash text not null, source_name text not null, imported_by text not null, edited_by text not null,
 due_date date not null, status text not null default 'draft' check(status in ('draft','invalid','validated','approved','delivered')),
 validated_at timestamptz, approved_by text, approved_at timestamptz, approval_note text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((status in ('approved','delivered')) = (approved_by is not null and approved_at is not null))
);
create table import_rows (
 id uuid primary key default gen_random_uuid(), batch_id uuid not null references batches(id),
 row_number integer not null check(row_number>0), original jsonb not null, values_json jsonb not null,
 errors jsonb not null default '[]', excluded boolean not null default false, exclusion_reason text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(batch_id,row_number), check(not excluded or length(trim(exclusion_reason))>0)
);
create table validations (
 id uuid primary key default gen_random_uuid(), batch_id uuid not null references batches(id),
 actor text not null, accepted_rows integer not null, rejected_rows integer not null, error_count integer not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table receipts (
 id uuid primary key default gen_random_uuid(), batch_id uuid not null unique references batches(id),
 destination text not null, content_hash text not null, row_count integer not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table notes (
 id uuid primary key default gen_random_uuid(), batch_id uuid not null references batches(id), actor text not null, body text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table activity (
 id uuid primary key default gen_random_uuid(), entity text not null, record_id uuid not null,
 actor text not null, action text not null, before_value jsonb, after_value jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function track_change() returns trigger language plpgsql as $$
declare who text:=current_setting('app.actor',true);
begin
 if who is null or trim(who)='' then raise exception 'Actor required'; end if;
 if TG_OP='DELETE' then raise exception 'Deletion is not supported'; end if;
 if TG_OP='UPDATE' then NEW.updated_at=clock_timestamp(); end if;
 insert into activity(entity,record_id,actor,action,before_value,after_value)
 values(TG_TABLE_NAME,NEW.id,who,TG_OP,case when TG_OP='UPDATE' then to_jsonb(OLD) else null end,to_jsonb(NEW));
 return NEW;
end $$;
create function immutable_record() returns trigger language plpgsql as $$
begin raise exception 'This record is append only'; end $$;
create function protect_row() returns trigger language plpgsql as $$
begin
 if TG_OP='UPDATE' and (NEW.batch_id<>OLD.batch_id or NEW.row_number<>OLD.row_number or NEW.original<>OLD.original) then raise exception 'Original row identity is immutable'; end if;
 if exists(select 1 from batches where id=NEW.batch_id and status in ('approved','delivered')) then raise exception 'Batch is locked'; end if;
 return NEW;
end $$;
create trigger protect_import_row before insert or update on import_rows for each row execute function protect_row();
do $$ declare t text; begin
 foreach t in array array['projects','mappings','batches','import_rows','validations','receipts','notes'] loop
 execute format('create trigger track before insert or update or delete on %I for each row execute function track_change()',t);
 end loop;
 foreach t in array array['mappings','validations','receipts','notes','activity'] loop
 execute format('create trigger immutable before update or delete on %I for each row execute function immutable_record()',t);
 end loop;
 foreach t in array array['projects','mappings','batches','import_rows','validations','receipts','notes','activity'] loop
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop;
end $$;
create index rows_by_batch on import_rows(batch_id,row_number);
create index events_by_record on activity(record_id,created_at);
create view batch_week as
 select b.id,b.code,b.name,p.code project,p.owner,b.due_date,b.status,b.edited_by,
 count(r.id)::integer total_rows,count(r.id) filter(where r.excluded)::integer excluded_rows,
 count(r.id) filter(where not r.excluded and jsonb_array_length(r.errors)>0)::integer rows_with_errors,
 b.approved_by,b.updated_at
 from batches b join projects p on p.id=b.project_id left join import_rows r on r.batch_id=b.id
 group by b.id,p.code,p.owner;
create view exception_queue as
 select b.code batch,p.owner,r.row_number,e.value->>'field' field,e.value->>'rule' rule,e.value->>'message' message
 from import_rows r join batches b on b.id=r.batch_id join projects p on p.id=b.project_id,
 lateral jsonb_array_elements(r.errors) e where not r.excluded;
create view compliance_checks as
 select b.code batch,'accuracy-review' rule,'NZ IPP8 / AU APP10' source,
 'Validate and independently approve this batch before use' finding
 from batches b where b.status not in ('approved','delivered')
 union all select b.code,'retention-review','NZ IPP9','Retention purpose review is due; do not hand over until reviewed'
 from batches b join projects p on p.id=b.project_id where p.retention_review<=current_date
 union all select b.code,'delivery-receipt','Local operational policy','Approved batch has no recorded file handover'
 from batches b where b.status='approved' and not exists(select 1 from receipts r where r.batch_id=b.id);
