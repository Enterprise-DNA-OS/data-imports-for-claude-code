do $$ begin
 if exists(select 1 from projects where code='DEMO-NORTH') then return; end if;
 perform set_config('app.actor','Fictional demo operator',true);
 insert into projects(id,code,name,owner,purpose,retention_review) values
 ('10000000-0000-4000-8000-000000000001','DEMO-NORTH','North supplier onboarding','Morgan','Fictional supplier setup for migration rehearsal',current_date+30),
 ('10000000-0000-4000-8000-000000000002','DEMO-SOUTH','South supplier onboarding','Alex','Fictional archive review exercise',current_date-3);
 insert into mappings(id,code,name,definition) values('20000000-0000-4000-8000-000000000001','SUPPLIERS-V1','Supplier records version 1',
 '[{"key":"supplier_id","source":"Supplier ID","type":"text","required":true,"unique":true,"trim":true},{"key":"name","source":"Supplier Name","type":"text","required":true,"trim":true},{"key":"email","source":"Contact Email","type":"email","required":true,"trim":true,"lowercase":true},{"key":"country","source":"Country","type":"enum","options":["NZ","AU"],"required":true},{"key":"terms_days","source":"Payment Terms","type":"integer","min":0,"max":90,"required":true}]');
 insert into batches(id,code,name,project_id,mapping_id,source_hash,source_name,imported_by,edited_by,due_date,status) values
 ('30000000-0000-4000-8000-000000000001','NORTH-01','North November suppliers','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','fictional-seed-north','fictional-north.csv','Morgan','Morgan',current_date-2,'invalid'),
 ('30000000-0000-4000-8000-000000000002','SOUTH-01','South November suppliers','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','fictional-seed-south','fictional-south.csv','Alex','Alex',current_date+2,'draft');
 insert into import_rows(batch_id,row_number,original,values_json,errors) values
 ('30000000-0000-4000-8000-000000000001',1,'{"Supplier ID":"N001"}','{"supplier_id":"N001","name":"Fictional Harbour Packaging","email":"accounts@example.invalid","country":"NZ","terms_days":"30"}','[]'),
 ('30000000-0000-4000-8000-000000000001',2,'{"Supplier ID":"N002"}','{"supplier_id":"N002","name":"Fictional Ridge Components","email":"missing-address","country":"AU","terms_days":"120"}','[{"field":"email","rule":"email","message":"Expected an email address"},{"field":"terms_days","rule":"max","message":"Must be at most 90"}]'),
 ('30000000-0000-4000-8000-000000000002',1,'{"Supplier ID":"S001"}','{"supplier_id":"S001","name":"Fictional Southern Fixtures","email":"demo@example.invalid","country":"NZ","terms_days":"14"}','[]');
 update batches set updated_at=now()-interval '9 days' where code='SOUTH-01';
end $$;
