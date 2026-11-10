/** How the plans page words a trial: a month-long one is "the first month free". */
export const trialLabel = (days: number) =>
  days >= 28 && days <= 31
    ? { short: "First month free", start: "Start your free month", length: "a month" }
    : { short: `${days}-day free trial`, start: `Start ${days}-day free trial`, length: `${days} days` }
