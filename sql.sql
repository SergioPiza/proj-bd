create table funcionario (
	cpf char(11) PRIMARY KEY,
	nome varchar(100) not null,
	vinculo varchar(50),
	tel varchar(20),
	email varchar(50),
	endereco varchar(150),
	data_nasc Date not null,
	salario real
)

insert into
	funcionario
		(cpf, data_nasc, email, endereco, nome, salario, tel, vinculo) 
		VALUES ('11111111111', TO_DATE('25/11/1997', 'DD/MM/YYYY'), 'sergiopiza@gmail.com', 'rua 0 ap 69', 'Sergio', 99.9, '16997498082', 'ceo')