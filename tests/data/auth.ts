export type UserCredentials = {
  name: string;
  surname: string;
  email: string;
  password: string;
};

export type RegistrationUser = UserCredentials & {
  passwordConfirmation: string;
};

// Наборы значений для проверки клиентской валидации
export const INVALID_REGISTRATION_DATA = {
  names: ['Я', ' '],
  emails: [' ', 'test@ru', 'test.ru', 'test@.com'],
  passwords: ['1234', '!@#.', ' '],
} as const;

export const USERS = {
  user1: {
    name: 'Иван',
    surname: 'Иванов',
    email: process.env.USER1_EMAIL ?? '',
    password: process.env.USER1_PASSWORD ?? '',
  },
  user2: {
    name: 'Петр',
    surname: 'Петров',
    email: process.env.USER2_EMAIL ?? '',
    password: process.env.USER2_PASSWORD ?? '',
  },
} as const satisfies Record<'user1' | 'user2', UserCredentials>;

// Тексты проверяем в одном месте
export const MESSAGES = {
  invalidCredentials: 'Ошибка входа. Неверный E-mail или пароль',
  invalidRegistration: 'Проверьте правильность заполнения полей',
  registrationError: 'Ошибка регистрации',
  registrationSuccess: 'Вы успешно зарегистрированы!',
  loginSuccess: 'Вход выполнен',
} as const;

export function createRegistrationUser(overrides: Partial<RegistrationUser> = {}): RegistrationUser {
  return {
    name: 'Петр',
    surname: 'Петров',
    // Уникальный email для каждого запуска
    email: `new_user_${Date.now()}@testtransflow.ru`,
    password: 'pass12345',
    passwordConfirmation: 'pass12345',
    ...overrides,
  };
}
