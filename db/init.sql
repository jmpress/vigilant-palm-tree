CREATE TABLE users(
    u_id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	u_email varchar(40) UNIQUE NOT NULL,
	salted_hashed_pass varchar(60),
	num_tix_closed integer
);

CREATE TABLE authentication_profiles(
	provider_id varchar(8),
	provider_name varchar(16),
	u_id integer REFERENCES users(u_id) ON DELETE CASCADE,
	auth_token varchar(40),
  	PRIMARY KEY(provider_id, provider_name)
);

CREATE TABLE tickets(
    ticket_id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	open_date date,
	close_date date,
	ticket_priority integer,
	ticket_status integer,
	ticket_subject varchar(50),
	ticket_description varchar(500),
	ticket_from varchar (40),
	opener_id integer REFERENCES users(u_id) ON DELETE SET NULL,
	closer_id integer REFERENCES users(u_id) ON DELETE SET NULL
);

INSERT INTO users (u_email, salted_hashed_pass, num_tix_closed)
VALUES 
('j.michael.press@gmail.com', 'example hash', 0);

INSERT INTO tickets (open_date, ticket_priority, ticket_status, ticket_subject, ticket_description, ticket_from, opener_id)
--open_date and opener_id should be taken from the current time and currently signed in user, respectively.
--ticket_status can be passed the default "open" status (1)
--user input values:
VALUES
('2022-08-10', 3, 1, 'GET request returns status 400', 'More details here to help describe the problem' , 'vigilant-palm-tree' , 0);
