export const MaxFileCount = {
  USER_AVATAR: 1,
} as const satisfies Record<string, number>;

export const FilePath = {
  USERS: 'uploads/images/users',
} as const satisfies Record<string, string>;
