/** The same rules as the storefront. */
export const PASSWORD_RULE = 'Use at least 8 characters, with an uppercase letter, a lowercase letter, and a number or symbol.';

export const passwordChecks = (password: string) => ({
  digitOrSymbol: /[^A-Za-zÀ-ÖØ-öø-ÿ\s]/.test(password),
  long: password.length >= 8,
  lower: /[a-zß-öø-ÿ]/.test(password),
  upper: /[A-ZÀ-ÖØ-Þ]/.test(password),
});

export const passwordOk = (password: string) => Object.values(passwordChecks(password)).every(Boolean);
