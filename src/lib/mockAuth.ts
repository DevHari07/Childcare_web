export interface MockUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  cell_phone?: string;
  role: 'parent' | 'provider' | 'admin';
}

interface StoredMockUser extends MockUser {
  password: string;
  security_question_1: string;
  security_answer_1: string;
  security_question_2: string;
  security_answer_2: string;
}

export interface SignupInput {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  cell_phone?: string;
  password: string;
  role: string;
  security_question_1: string;
  security_answer_1: string;
  security_question_2: string;
  security_answer_2: string;
}

const USERS_KEY = 'mock_users';

function defaultUsers(): StoredMockUser[] {
  return [
    {
      id: 1,
      first_name: 'Demo',
      last_name: 'Parent',
      username: 'demoparent',
      email: 'demoparent@example.com',
      cell_phone: '',
      role: 'parent',
      password: 'Demo1234!',
      security_question_1: 'What was the name of your first pet?',
      security_answer_1: 'demo',
      security_question_2: "What is your mother's maiden name?",
      security_answer_2: 'demo',
    },
    {
      id: 2,
      first_name: 'Demo',
      last_name: 'Provider',
      username: 'demoprovider',
      email: 'demoprovider@example.com',
      cell_phone: '',
      role: 'provider',
      password: 'Demo1234!',
      security_question_1: 'What was the name of your first pet?',
      security_answer_1: 'demo',
      security_question_2: "What is your mother's maiden name?",
      security_answer_2: 'demo',
    },
  ];
}

function readUsers(): StoredMockUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    const seeded = defaultUsers();
    localStorage.setItem(USERS_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const seeded = defaultUsers();
    localStorage.setItem(USERS_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function writeUsers(users: StoredMockUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toPublicUser(user: StoredMockUser): MockUser {
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    email: user.email,
    cell_phone: user.cell_phone,
    role: user.role,
  };
}

function generateToken(user: MockUser): string {
  return btoa(`${user.username}:${Date.now()}`);
}

export function signup(input: SignupInput): MockUser {
  const users = readUsers();

  const usernameTaken = users.some((u) => u.username.toLowerCase() === input.username.toLowerCase());
  if (usernameTaken) {
    throw new Error('That User ID is already taken. Please choose another.');
  }

  const emailTaken = users.some((u) => u.email.toLowerCase() === input.email.toLowerCase());
  if (emailTaken) {
    throw new Error('An account with that email address already exists.');
  }

  const nextId = users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
  const role = input.role === 'provider' || input.role === 'admin' ? input.role : 'parent';

  const newUser: StoredMockUser = {
    id: nextId,
    first_name: input.first_name,
    last_name: input.last_name,
    username: input.username,
    email: input.email,
    cell_phone: input.cell_phone,
    role,
    password: input.password,
    security_question_1: input.security_question_1,
    security_answer_1: input.security_answer_1,
    security_question_2: input.security_question_2,
    security_answer_2: input.security_answer_2,
  };

  users.push(newUser);
  writeUsers(users);

  return toPublicUser(newUser);
}

export function login(usernameOrEmail: string, password: string): { token: string; user: MockUser } {
  const users = readUsers();
  const match = users.find(
    (u) =>
      u.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
      u.email.toLowerCase() === usernameOrEmail.toLowerCase()
  );

  if (!match || match.password !== password) {
    throw new Error('Invalid User ID/email or password. Please try again.');
  }

  const user = toPublicUser(match);
  return { token: generateToken(user), user };
}
