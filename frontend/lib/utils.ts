let inMemoryToken: string | null = null;

export const setInMemoryToken = (token: string | null): void => {
  inMemoryToken = token;
};

export const getInMemoryToken = (): string | null => inMemoryToken;
