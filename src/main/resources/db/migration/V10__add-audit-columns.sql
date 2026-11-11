-- V10: Adiciona colunas de auditoria e rastreabilidade para conformidade LGPD e CFM

alter table medicos add column criado_em datetime not null default current_timestamp;
alter table medicos add column atualizado_em datetime not null default current_timestamp;
alter table medicos add column criado_por varchar(100) not null default 'SISTEMA';
alter table medicos add column atualizado_por varchar(100) not null default 'SISTEMA';

alter table pacientes add column criado_em datetime not null default current_timestamp;
alter table pacientes add column atualizado_em datetime not null default current_timestamp;
alter table pacientes add column criado_por varchar(100) not null default 'SISTEMA';
alter table pacientes add column atualizado_por varchar(100) not null default 'SISTEMA';

alter table consultas add column criado_em datetime not null default current_timestamp;
alter table consultas add column atualizado_em datetime not null default current_timestamp;
alter table consultas add column criado_por varchar(100) not null default 'SISTEMA';
alter table consultas add column atualizado_por varchar(100) not null default 'SISTEMA';

alter table prontuarios add column criado_em datetime not null default current_timestamp;
alter table prontuarios add column atualizado_em datetime not null default current_timestamp;
alter table prontuarios add column criado_por varchar(100) not null default 'SISTEMA';
alter table prontuarios add column atualizado_por varchar(100) not null default 'SISTEMA';

alter table usuarios add column criado_em datetime not null default current_timestamp;
alter table usuarios add column atualizado_em datetime not null default current_timestamp;
alter table usuarios add column criado_por varchar(100) not null default 'SISTEMA';
alter table usuarios add column atualizado_por varchar(100) not null default 'SISTEMA';
