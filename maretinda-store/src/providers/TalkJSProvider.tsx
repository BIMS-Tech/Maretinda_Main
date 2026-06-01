'use client'

type TalkJSProviderProps = {
	appId?: string
	user?: unknown
	children: React.ReactNode
}

export function TalkJSProvider({ children }: TalkJSProviderProps) {
	return <>{children}</>
}
