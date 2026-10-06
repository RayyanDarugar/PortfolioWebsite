import { VIDEOS } from '@/content/videos'
import { OSWindow } from '../OSWindow'
import { INK } from '../chrome'
import type { AppSceneProps } from '../registry'

/**
 * The videography portfolio, as a grid of players. `preload="metadata"` so
 * each tile shows a first frame without downloading the whole film.
 */
export function VideosApp({ onClose }: AppSceneProps) {
  return (
    <OSWindow title="Videos" subtitle={`${VIDEOS.length} films`} onClose={onClose}>
      <div className="h-full overflow-y-auto p-[clamp(18px,2vw,30px)]">
        <ul className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-3">
          {VIDEOS.map((video) => (
            <li key={video.src} className="flex flex-col gap-[8px]">
              <video
                src={video.src}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full rounded-[8px] bg-black"
              />
              <div>
                <b className="block text-[14.5px] font-bold" style={{ color: INK.strong }}>{video.title}</b>
                <span className="text-[12.5px]" style={{ color: INK.dim }}>{video.note}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </OSWindow>
  )
}
