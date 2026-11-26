/** The colours of the storefront, for the app. tailwind.config.js has the same ones. */
export const colors = {
  purple: '#432C63',
  deep: '#372248',
  ink: '#1B1B1B',
  yellow: '#FFC533',
  cream: '#FAF8F5',
  lilac: '#F6F2FB',
  line: '#EDEAE3',
  muted: '#737373',
  faint: '#A39DAC',
  red: '#C43131',
  green: '#1F7A4D',
  white: '#FFFFFF',
};

/** Headings, as on the storefront. */
export const serif = 'DMSerifDisplay_400Regular';

/** Soft grounds for product pictures, the same one for a product every time. */
const GROUNDS = ['#F3EFF8', '#FBF3E2', '#EAF1EC', '#FAECE8', '#EAF0F8', '#F5F1EA'];
export const groundOf = (id: string) =>
  GROUNDS[[...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7) % GROUNDS.length];
