import { useEffect, useRef } from "react"

// Augment JSX to allow <model-viewer> as a valid element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string
        poster?: string
        alt?: string
        "auto-rotate"?: boolean | string
        "camera-controls"?: boolean | string
        "shadow-intensity"?: string
        "environment-image"?: string
        style?: React.CSSProperties
        className?: string
      }
    }
  }
}

const VIEWER_SCRIPT_SRC =
  "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"

let scriptLoaded = false

function ensureModelViewerScript() {
  if (scriptLoaded || document.querySelector(`script[src="${VIEWER_SCRIPT_SRC}"]`)) {
    scriptLoaded = true
    return
  }
  const script = document.createElement("script")
  script.type = "module"
  script.src = VIEWER_SCRIPT_SRC
  script.async = true
  document.head.appendChild(script)
  scriptLoaded = true
}

type ModelViewerProps = {
  src: string
  poster?: string
  className?: string
}

export const ModelViewerElement = ({ src, poster, className }: ModelViewerProps) => {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    ensureModelViewerScript()
  }, [])

  return (
    <model-viewer
      ref={ref as any}
      src={src}
      poster={poster}
      alt="3D product model"
      auto-rotate="true"
      camera-controls="true"
      shadow-intensity="1"
      environment-image="neutral"
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  )
}
