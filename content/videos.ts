/**
 * The videography portfolio.
 *
 * TEMPORARY HOSTING: these files live in the old site's repo
 * (RayyanDarugar/RayyanWebsite, gh-pages branch), served by GitHub Pages at
 * its github.io address. Deleting, renaming or privatising that repo, or
 * giving it a custom domain again, breaks every link here. Move them to
 * YouTube, Vimeo or Vercel Blob when the site moves to Vercel.
 */

export interface Video {
  title: string
  src: string
  /** What it was for, in a few words. */
  note: string
}

const OLD_SITE = 'https://rayyandarugar.github.io/RayyanWebsite/videos'

export const VIDEOS: readonly Video[] = [
  { title: 'Homecoming 2024', src: `${OLD_SITE}/HOMECOMING_FINAL.mp4`, note: 'Del Norte High School' },
  { title: 'Football Season Hype', src: `${OLD_SITE}/FOOTBALL%20HYPE%20EDIT.mp4`, note: 'Del Norte High School' },
  { title: 'Basketball Hype Edit', src: `${OLD_SITE}/BASKETBALL%20HYPE%20EDIT.mp4`, note: 'Del Norte High School' },
  { title: 'Military Night Tribute', src: `${OLD_SITE}/MILITARY_NIGHT.mp4`, note: 'Del Norte High School' },
  { title: 'Football Intro Sequence', src: `${OLD_SITE}/FOOTBALL%20INTRO.mp4`, note: 'Del Norte High School' },
  { title: 'Wedding Cinematography', src: `${OLD_SITE}/Wedding%20Video%20FINAL%20FINAL.mov`, note: 'Wedding film' },
]
