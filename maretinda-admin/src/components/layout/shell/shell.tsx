import { SidebarLeft, TriangleRightMini, XMark } from "@medusajs/icons"
import { IconButton, clx } from "@medusajs/ui"
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react"
import { Dialog as RadixDialog } from "radix-ui"
import { PropsWithChildren, ReactNode, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Link,
  Outlet,
  UIMatch,
  useLocation,
  useMatches,
  useNavigation,
} from "react-router-dom"

import { KeybindProvider } from "../../../providers/keybind-provider"
import { useGlobalShortcuts } from "../../../providers/keybind-provider/hooks"
import { useSidebar } from "../../../providers/sidebar-provider"
import { ProgressBar } from "../../common/progress-bar"
import { Notifications } from "../notifications"

export const Shell = ({ children }: PropsWithChildren) => {
  const globalShortcuts = useGlobalShortcuts()
  const navigation = useNavigation()

  const loading = navigation.state === "loading"

  return (
    <KeybindProvider shortcuts={globalShortcuts}>
      <div className="relative flex h-screen flex-col items-start overflow-hidden lg:flex-row">
        <NavigationBar loading={loading} />
        <div>
          <LayoutGroup id="mobile-menu">
            <MobileSidebarContainer>{children}</MobileSidebarContainer>
          </LayoutGroup>
          <LayoutGroup id="desktop-menu">
            <DesktopSidebarContainer>{children}</DesktopSidebarContainer>
          </LayoutGroup>
        </div>
        <div className="flex h-screen w-full flex-col overflow-auto">
          <Topbar />
          <main
            className={clx(
              "flex h-full w-full flex-col items-center overflow-y-auto transition-opacity delay-200 duration-200",
              {
                "opacity-25": loading,
              }
            )}
          >
            <Gutter>
              <PageTransition>
                <Outlet />
              </PageTransition>
            </Gutter>
          </main>
        </div>
      </div>
    </KeybindProvider>
  )
}

const NavigationBar = ({ loading }: { loading: boolean }) => {
  const [showBar, setShowBar] = useState(false)

  /**
   * If the loading state is true, we want to show the bar after a short delay.
   * The delay is used to prevent the bar from flashing on quick navigations.
   */
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (loading) {
      timeout = setTimeout(() => {
        setShowBar(true)
      }, 200)
    } else {
      setShowBar(false)
    }

    return () => {
      clearTimeout(timeout)
    }
  }, [loading])

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1">
      <AnimatePresence>{showBar ? <ProgressBar /> : null}</AnimatePresence>
    </div>
  )
}

/**
 * Each section rises in, and its cards and first table rows follow one after
 * another (.page-in in brand-theme.css). Keyed on the first path segment only,
 * so a modal route opened over a list (e.g. /products/create) leaves the list
 * where it is.
 */
const PageTransition = ({ children }: PropsWithChildren) => {
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const section = pathname.split("/")[1] ?? ""
  return (
    <motion.div
      key={section}
      className="page-in flex flex-col gap-y-2"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

const Gutter = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex w-full max-w-[1600px] flex-col gap-y-2 p-3">
      {children}
    </div>
  )
}

const Breadcrumbs = () => {
  const matches = useMatches() as unknown as UIMatch<
    unknown,
    {
      breadcrumb?: (match?: UIMatch) => string | ReactNode
    }
  >[]

  const crumbs = matches
    .filter((match) => match.handle?.breadcrumb)
    .map((match) => {
      const handle = match.handle

      let label: string | ReactNode | undefined = undefined

      try {
        label = handle.breadcrumb?.(match)
      } catch (error) {
        // noop
      }

      if (!label) {
        return null
      }

      return {
        label: label,
        path: match.pathname,
      }
    })
    .filter(Boolean) as { label: string | ReactNode; path: string }[]

  return (
    <ol
      className={clx(
        "text-ui-fg-muted txt-compact-small-plus flex select-none items-center"
      )}
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1
        const isSingle = crumbs.length === 1

        return (
          <motion.li
            key={crumb.path}
            className={clx("flex items-center")}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: index * 0.04 }}
          >
            {!isLast ? (
              <Link
                className="transition-fg hover:text-ui-fg-subtle"
                to={crumb.path}
              >
                {crumb.label}
              </Link>
            ) : (
              <div>
                {!isSingle && <span className="block lg:hidden">...</span>}
                <span
                  key={index}
                  className={clx({
                    "hidden lg:block": !isSingle,
                  })}
                >
                  {crumb.label}
                </span>
              </div>
            )}
            {!isLast && (
              <span className="mx-2">
                <TriangleRightMini className="rtl:rotate-180" />
              </span>
            )}
          </motion.li>
        )
      })}
    </ol>
  )
}

const ToggleSidebar = () => {
  const { toggle } = useSidebar()

  return (
    <div>
      <IconButton
        className="hidden lg:flex"
        variant="transparent"
        onClick={() => toggle("desktop")}
        size="small"
      >
        <SidebarLeft className="text-ui-fg-muted rtl:rotate-180" />
      </IconButton>
      <IconButton
        className="hidden max-lg:flex"
        variant="transparent"
        onClick={() => toggle("mobile")}
        size="small"
      >
        <SidebarLeft className="text-ui-fg-muted rtl:rotate-180" />
      </IconButton>
    </div>
  )
}

const Topbar = () => {
  return (
    <div className="grid w-full grid-cols-2 border-b p-3">
      <div className="flex items-center gap-x-1.5">
        <ToggleSidebar />
        <Breadcrumbs />
      </div>
      <div className="flex items-center justify-end gap-x-3">
        <Notifications />
      </div>
    </div>
  )
}

const DesktopSidebarContainer = ({ children }: PropsWithChildren) => {
  const { desktop } = useSidebar()

  return (
    <div
      className={clx("hidden h-screen w-[220px] border-e", {
        "lg:flex": desktop,
      })}
    >
      {children}
    </div>
  )
}

const MobileSidebarContainer = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation()
  const { mobile, toggle } = useSidebar()

  return (
    <RadixDialog.Root open={mobile} onOpenChange={() => toggle("mobile")}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className={clx(
            "bg-ui-bg-overlay fixed inset-0",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <RadixDialog.Content
          className={clx(
            "bg-ui-bg-subtle shadow-elevation-modal fixed inset-y-2 start-2 flex w-full max-w-[304px] flex-col overflow-hidden rounded-lg border-r",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-start-1/2 data-[state=open]:slide-in-from-start-1/2 duration-200"
          )}
        >
          <div className="p-3">
            <RadixDialog.Close asChild>
              <IconButton
                size="small"
                variant="transparent"
                className="text-ui-fg-subtle"
              >
                <XMark />
              </IconButton>
            </RadixDialog.Close>
            <RadixDialog.Title className="sr-only">
              {t("app.nav.accessibility.title")}
            </RadixDialog.Title>
            <RadixDialog.Description className="sr-only">
              {t("app.nav.accessibility.description")}
            </RadixDialog.Description>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
