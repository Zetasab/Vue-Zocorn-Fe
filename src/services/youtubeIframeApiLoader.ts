export interface YoutubePlayerEvent {
  target: YoutubePlayer
  data: number
}

export interface YoutubePlayer {
  destroy(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  playVideo(): void
  mute(): void
  getIframe(): HTMLIFrameElement
}

export interface YoutubePlayerOptions {
  videoId: string
  width?: string | number
  height?: string | number
  playerVars?: Record<string, string | number>
  events?: {
    onReady?: (event: YoutubePlayerEvent) => void
    onStateChange?: (event: YoutubePlayerEvent) => void
  }
}

interface YoutubeIframeApi {
  Player: new (elementId: string, options: YoutubePlayerOptions) => YoutubePlayer
  PlayerState: { ENDED: number }
}

declare global {
  interface Window {
    YT?: YoutubeIframeApi
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<YoutubeIframeApi> | null = null

export function loadYoutubeIframeApi(): Promise<YoutubeIframeApi> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT)
  }

  if (apiPromise) {
    return apiPromise
  }

  apiPromise = new Promise((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.()
      resolve(window.YT as YoutubeIframeApi)
    }

    if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      return
    }

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })

  return apiPromise
}
