import {
  ArrowPath,
  Bolt,
  MediaPlay,
  Buildings,
  ChevronDownMini,
  CogSixTooth,
  CurrencyDollar,
  MagnifyingGlass,
  MinusMini,
  ReceiptPercent,
  ShoppingCart,
  Tag,
  Users,
  Component,
  Star,
  ListCheckbox,
  ChatBubbleLeftRight,
  TruckFast,
} from "@medusajs/icons"
import { Divider, Text, clx } from "@medusajs/ui"
import { Collapsible as RadixCollapsible } from "radix-ui"
import { useTranslation } from "react-i18next"

import { Skeleton } from "../../common/skeleton"
import { INavItem, NavItem } from "../../layout/nav-item"
import { Shell } from "../../layout/shell"

import { Link, useLocation } from "react-router-dom"
import { useMe } from "../../../hooks/api"

import { useSearch } from "../../../providers/search-provider"
import { UserMenu } from "../user-menu"
import { ImageAvatar } from "../../common/image-avatar"
import {
  isSubscriptionActive,
  useSubscriptionStatus,
} from "../../../hooks/api/subscription"
import { useSetupTasks } from "../../../hooks/api/setup-tasks"
import { CompletionBar } from "../../common/completion-bar"
import { usePlanLimits } from "../../../hooks/api/plan-limits"
import { useChatConversations } from "../../../hooks/api/chat"

export const MainLayout = () => {
  /**
   * Already resolved by `ProtectedRoute`, which also handles the redirect — this
   * reads from cache, so the sidebar renders its final shape on first paint.
   */
  const { data } = useSubscriptionStatus()

  return (
    <Shell>
      <MainSidebar subscriptionActive={isSubscriptionActive(data)} />
    </Shell>
  )
}

const MainSidebar = ({ subscriptionActive }: { subscriptionActive: boolean }) => {
  return (
    <aside className="flex flex-1 flex-col justify-between overflow-y-auto">
      <div className="flex flex-1 flex-col">
        <div className="bg-ui-bg-subtle sticky top-0">
          <Header />
          <div className="px-3">
            <Divider variant="dashed" />
          </div>
        </div>
        {!subscriptionActive && (
          <div className="mx-3 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <p className="font-semibold">Subscription Required</p>
            <p className="mt-0.5 text-amber-600">Activate a plan to access all features.</p>
          </div>
        )}
        <div className="flex flex-1 flex-col justify-between">
          <div className="flex flex-1 flex-col">
            {subscriptionActive && <CoreRouteSection />}
            <ExtensionRouteSection subscriptionActive={subscriptionActive} />
          </div>
          {subscriptionActive && (
          <>
            <SetupWidget />
            <SupportWidget />
            <UtilitySection />
          </>
        )}
        </div>
        <div className="bg-ui-bg-subtle sticky bottom-0">
          <UserSection />
        </div>
      </div>
    </aside>
  )
}

const Header = () => {
  const { seller } = useMe()

  const name = seller?.name || ""
  const fallback = seller?.photo || "M"

  return (
    <div className="w-full p-3 p-0.5 pr-2 bg-ui-bg-subtle grid w-full grid-cols-[24px_1fr_15px] items-center gap-x-3">
      {fallback ? (
        <div className="w-7 h-7">
          <ImageAvatar src={seller?.photo} fallback={seller?.name} size={7} rounded />
        </div>
      ) : (
        <Skeleton className="h-6 w-6 rounded-md" />
      )}
      <div className="block overflow-hidden text-left">
        {name ? (
          <Text
            size="small"
            weight="plus"
            leading="compact"
            className="truncate"
          >
            {name}
          </Text>
        ) : (
          <Skeleton className="h-[9px] w-[120px]" />
        )}
      </div>
    </div>
  )
}

const useCoreRoutes = (): Omit<INavItem, "pathname">[] => {
  const { t } = useTranslation()

  const { data: chatData } = useChatConversations()
  const unreadCount = chatData?.unread ?? 0

  return [
    {
      icon: <Component />,
      label: "Dashboard",
      to: "/dashboard",
    },
    {
      icon: <ShoppingCart />,
      label: t("orders.domain"),
      to: "/orders",
      items: [
        // TODO: Enable when domin is introduced
        // {
        //   label: t("draftOrders.domain"),
        //   to: "/draft-orders",
        // },
      ],
    },
    {
      icon: <Tag />,
      label: t("products.domain"),
      to: "/products",
      items: [
        {
          label: t("collections.domain"),
          to: "/collections",
        },
        {
          label: t("categories.domain"),
          to: "/categories",
        },
        // TODO: Enable when domin is introduced
        // {
        //   label: t("giftCards.domain"),
        //   to: "/gift-cards",
        // },
      ],
    },
    {
      icon: <Buildings />,
      label: t("inventory.domain"),
      to: "/inventory",
      items: [
        {
          label: t("reservations.domain"),
          to: "/reservations",
        },
      ],
    },
    {
      icon: <Users />,
      label: t("customers.domain"),
      to: "/customers",
      items: [
        {
          label: t("customerGroups.domain"),
          to: "/customer-groups",
        },
      ],
    },
    {
      icon: <Bolt />,
      label: "Flash Sales",
      to: "/flash-sales",
    },
    {
      icon: <MediaPlay />,
      label: "Reels",
      to: "/reels",
    },
    {
      icon: <ArrowPath />,
      label: "Subscription Products",
      to: "/subscription-products",
    },
    {
      icon: <ReceiptPercent />,
      label: t("promotions.domain"),
      to: "/promotions",
      items: [
        {
          label: t("campaigns.domain"),
          to: "/campaigns",
        },
      ],
    },
    {
      icon: <CurrencyDollar />,
      label: t("priceLists.domain"),
      to: "/price-lists",
    },
    {
      icon: <TruckFast />,
      label: "Shipping",
      to: "/shipping",
    },
    {
      icon: <Star />,
      label: "Reviews",
      to: "/reviews",
    },
    {
      icon: <ChatBubbleLeftRight />,
      label: `Messages${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
      to: "/messages",
    },
    {
      icon: <ListCheckbox />,
      label: "Requests",
      to: "/requests",
      items: [
        {
          label: "Collections",
          to: "/requests/collections",
        },
        {
          label: "Categories",
          to: "/requests/categories",
        },
        {
          label: "Brands",
          to: "/requests/brands",
        },
        {
          label: "Reviews",
          to: "/requests/reviews",
        },
        {
          label: "Orders",
          to: "/requests/orders",
        },
      ],
    },
  ]
}

const GiyaPayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2 4C2 2.89543 2.89543 2 4 2H20C21.1046 2 22 2.89543 22 4V20C22 21.1046 21.1046 22 20 22H4C2.89543 22 2 21.1046 2 20V4Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M7 12L10 15L17 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SubscriptionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const useExtensionRoutes = (): Omit<INavItem, "pathname">[] => {
  return [
    {
      icon: <GiyaPayIcon />,
      label: "GiyaPay",
      to: "/giyapay",
    },
    {
      icon: <SubscriptionIcon />,
      label: "Subscription",
      to: "/subscription",
    },
  ]
}

const Searchbar = () => {
  const { t } = useTranslation()
  const { toggleSearch } = useSearch()

  return (
    <div className="px-3">
      <button
        onClick={toggleSearch}
        className={clx(
          "bg-ui-bg-subtle text-ui-fg-subtle flex w-full items-center gap-x-2.5 rounded-md px-2 py-1 outline-none",
          "hover:bg-ui-bg-subtle-hover",
          "focus-visible:shadow-borders-focus"
        )}
      >
        <MagnifyingGlass />
        <div className="flex-1 text-left">
          <Text size="small" leading="compact" weight="plus">
            {t("app.search.label")}
          </Text>
        </div>
        <Text size="small" leading="compact" className="text-ui-fg-muted">
          ⌘K
        </Text>
      </button>
    </div>
  )
}

const CoreRouteSection = () => {
  const coreRoutes = useCoreRoutes()

  return (
    <nav className="flex flex-col gap-y-1 py-3">
      <Searchbar />
      {coreRoutes.map((route) => {
        return <NavItem key={route.to} {...route} />
      })}
    </nav>
  )
}

const ExtensionRouteSection = ({ subscriptionActive }: { subscriptionActive: boolean }) => {
  const allExtensionRoutes = useExtensionRoutes()
  const { t } = useTranslation()

  const extensionRoutes = subscriptionActive
    ? allExtensionRoutes
    : allExtensionRoutes.filter((r) => r.to === "/subscription")

  if (!extensionRoutes.length) return null

  return (
    <div>
      <div className="px-3">
        <Divider variant="dashed" />
      </div>
      <div className="flex flex-col gap-y-1 py-3">
        <RadixCollapsible.Root defaultOpen>
          <div className="px-4">
            <RadixCollapsible.Trigger asChild className="group/trigger">
              <button className="text-ui-fg-subtle flex w-full items-center justify-between px-2">
                <Text size="xsmall" weight="plus" leading="compact">
                  {t("app.nav.common.extensions")}
                </Text>
                <div className="text-ui-fg-muted">
                  <ChevronDownMini className="group-data-[state=open]/trigger:hidden" />
                  <MinusMini className="group-data-[state=closed]/trigger:hidden" />
                </div>
              </button>
            </RadixCollapsible.Trigger>
          </div>
          <RadixCollapsible.Content>
            <nav className="flex flex-col gap-y-0.5 py-1 pb-4">
              {extensionRoutes.map((route) => {
                return <NavItem key={route.to} {...route} />
              })}
            </nav>
          </RadixCollapsible.Content>
        </RadixCollapsible.Root>
      </div>
    </div>
  )
}

const SupportWidget = () => {
  const { supportLevel, planName } = usePlanLimits()

  if (!planName) return null

  if (supportLevel === "dedicated") {
    return (
      <div className="mx-3 mb-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5">
        <p className="text-xs font-semibold text-violet-800">Dedicated Account Manager</p>
        <a
          href="mailto:accounts@maretinda.com?subject=Account%20Manager%20Request"
          className="mt-1 block text-xs text-violet-600 hover:underline"
        >
          Contact your manager →
        </a>
      </div>
    )
  }

  if (supportLevel === "priority") {
    return (
      <div className="mx-3 mb-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
        <p className="text-xs font-semibold text-blue-800">Priority Support</p>
        <div className="mt-1 flex items-center gap-2">
          <a
            href="mailto:priority@maretinda.com?subject=Priority%20Support"
            className="text-xs text-blue-600 hover:underline"
          >
            Email →
          </a>
          <span className="text-blue-300">|</span>
          <a
            href="https://maretinda.com/live-chat"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Live Chat →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-3 mb-2 rounded-lg border border-ui-border-base bg-ui-bg-subtle px-3 py-2.5">
      <p className="text-xs font-semibold text-ui-fg-subtle">Email Support</p>
      <a
        href="mailto:support@maretinda.com"
        className="mt-1 block text-xs text-ui-fg-muted hover:underline"
      >
        support@maretinda.com
      </a>
    </div>
  )
}

const SetupWidget = () => {
  const { pendingCount, progress } = useSetupTasks()

  if (!pendingCount) {
    return null
  }

  return (
    <Link
      to="/settings/store"
      className="mx-3 mb-2 block rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 transition-colors hover:bg-red-100"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-red-800">Finish store setup</p>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-medium leading-none text-white">
          {pendingCount}
        </span>
      </div>
      <p className="mt-1 text-xs text-red-600">
        {progress.percent}% complete — {progress.completedCount} of{" "}
        {progress.totalCount} details added.
      </p>
      <CompletionBar percent={progress.percent} size="small" className="mt-2" />
    </Link>
  )
}

const UtilitySection = () => {
  const location = useLocation()
  const { t } = useTranslation()
  const { pendingCount } = useSetupTasks()

  return (
    <div className="flex flex-col gap-y-0.5 py-3">
      <NavItem
        label={t("app.nav.settings.header")}
        to="/settings"
        from={location.pathname}
        icon={<CogSixTooth />}
        badge={pendingCount}
      />
    </div>
  )
}

const UserSection = () => {
  return (
    <div>
      <div className="px-3">
        <Divider variant="dashed" />
      </div>
      <UserMenu />
    </div>
  )
}
