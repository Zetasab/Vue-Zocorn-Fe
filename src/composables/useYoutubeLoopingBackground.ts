import { onBeforeUnmount, watch, type Ref } from 'vue'
import { loadYoutubeIframeApi, type YoutubePlayer, type YoutubePlayerEvent } from '../services/youtubeIframeApiLoader'

const ENDED_STATE = 0

/**
 * Plays a muted, looping YouTube background video without ever entering
 * YouTube's "playlist" chrome (the prev/pause/next overlay it shows for a
 * few seconds when looping is done via the `loop=1&playlist=` URL trick).
 * Looping here is done by restarting the video manually on the `ended` event.
 */
export function useYoutubeLoopingBackground(elementId: Ref<string>, videoId: Ref<string | null>): void {
  let player: YoutubePlayer | null = null

  function destroyPlayer(): void {
    player?.destroy()
    player = null
  }

  async function createPlayer(id: string, video: string): Promise<void> {
    const YT = await loadYoutubeIframeApi()

    if (elementId.value !== id || videoId.value !== video || !document.getElementById(id)) {
      return
    }

    player = new YT.Player(id, {
      videoId: video,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        fs: 0,
        iv_load_policy: 3
      },
      events: {
        onReady: (event: YoutubePlayerEvent) => {
          event.target.mute()
          event.target.playVideo()
          // The target <div> gets replaced by YouTube's <iframe>, which drops
          // any CSS classes/inline sizing that lived on it — make it fill its
          // (already correctly positioned/sized) wrapper element instead.
          const iframe = event.target.getIframe()
          iframe.style.width = '100%'
          iframe.style.height = '100%'
          iframe.style.border = '0'
          iframe.style.display = 'block'
          iframe.style.pointerEvents = 'none'
        },
        onStateChange: (event: YoutubePlayerEvent) => {
          if (event.data === ENDED_STATE) {
            event.target.seekTo(0, true)
            event.target.playVideo()
          }
        }
      }
    })
  }

  watch(
    [elementId, videoId],
    ([nextElementId, nextVideoId]) => {
      destroyPlayer()

      if (nextVideoId && nextElementId) {
        void createPlayer(nextElementId, nextVideoId)
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    destroyPlayer()
  })
}
