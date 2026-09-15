-- Reference data for the Child Support Application schema. Idempotent.

-- ── roles ──────────────────────────────────────────────────────────────────
insert into roles (role_name, description) values
  ('parent',     'Custodial / non-custodial parent or guardian applying for services'),
  ('provider',   'Child care provider account'),
  ('caseworker', 'Regional Child Support Unit staff reviewing applications'),
  ('admin',      'System administrator')
on conflict (role_name) do nothing;

-- ── security questions (mirror the signup form) ────────────────────────────
insert into security_questions (question_text) values
  ('What was the name of your first pet?'),
  ('In what city were you born?'),
  ('What was the name of your elementary school?'),
  ('What street did you grow up on?'),
  ('What was the make and model of your first car?'),
  ('What is your mother''s maiden name?'),
  ('In what city did your parents meet?'),
  ('What was the name of your first boss?'),
  ('What was your childhood nickname?'),
  ('What was the name of the hospital you were born in?')
on conflict (question_text) do nothing;

-- ── US states + territories ───────────────────────────────────────────────
insert into state (name, short_code) values
  ('Alabama','AL'),('Alaska','AK'),('Arizona','AZ'),('Arkansas','AR'),('California','CA'),
  ('Colorado','CO'),('Connecticut','CT'),('Delaware','DE'),('District of Columbia','DC'),
  ('Florida','FL'),('Georgia','GA'),('Hawaii','HI'),('Idaho','ID'),('Illinois','IL'),
  ('Indiana','IN'),('Iowa','IA'),('Kansas','KS'),('Kentucky','KY'),('Louisiana','LA'),
  ('Maine','ME'),('Maryland','MD'),('Massachusetts','MA'),('Michigan','MI'),('Minnesota','MN'),
  ('Mississippi','MS'),('Missouri','MO'),('Montana','MT'),('Nebraska','NE'),('Nevada','NV'),
  ('New Hampshire','NH'),('New Jersey','NJ'),('New Mexico','NM'),('New York','NY'),
  ('North Carolina','NC'),('North Dakota','ND'),('Ohio','OH'),('Oklahoma','OK'),('Oregon','OR'),
  ('Pennsylvania','PA'),('Rhode Island','RI'),('South Carolina','SC'),('South Dakota','SD'),
  ('Tennessee','TN'),('Texas','TX'),('Utah','UT'),('Vermont','VT'),('Virginia','VA'),
  ('Washington','WA'),('West Virginia','WV'),('Wisconsin','WI'),('Wyoming','WY'),
  ('Puerto Rico','PR'),('Guam','GU'),('U.S. Virgin Islands','VI'),('American Samoa','AS'),
  ('Northern Mariana Islands','MP')
on conflict (short_code) do nothing;
