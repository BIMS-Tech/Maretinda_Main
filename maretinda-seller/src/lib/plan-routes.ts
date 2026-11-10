/**
 * Pages a seller can still use without an active plan, matching what the API
 * allows (backend lib/seller-plan): renewing, and finishing the orders and
 * returns buyers already placed, chatting with those buyers and getting paid.
 * Everything else sends them to Subscription.
 */
const WORKS_WITHOUT_PLAN = /^\/(subscription|orders|requests\/orders|messages|giyapay|shipping)(\/|$)/

export const worksWithoutPlan = (pathname: string): boolean => WORKS_WITHOUT_PLAN.test(pathname)
