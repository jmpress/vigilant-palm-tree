CREATE TABLE users(
    tech_id integer PRIMARY KEY,
	tech_email varchar(20) UNIQUE NOT NULL,
	salted_hashed_pass varchar(40),
	num_tix_closed integer
);

CREATE TABLE tickets(
    ticket_id integer,
	open_date date,
	close_date date,
	ticket_priority integer,
	ticket_status integer,
	ticket_subject varchar(50),
	ticket_description varchar(100),
	opener_id varchar(20) REFERENCES users(tech_id) ON DELETE SET NULL,
	closer_id varchar(20) REFERENCES users(tech_id) ON DELETE SET NULL
);