/**
 * The videography portfolio.
 *
 * TEMPORARY HOSTING: these files live on the current rayyandarugar.com, which
 * this site replaces. They have to move (Vercel Blob, YouTube or Vimeo) before
 * the domain switch, or every link here breaks.
 */

export interface Video {
  title: string
  src: string
  /** What it was for, in a few words. */
  note: string
}

const OLD_SITE = 'https://rayyandarugar.com/videos'

export const VIDEOS: readonly Video[] = [
  { title: 'Homecoming 2024', src: `${OLD_SITE}/HOMECOMING_FINAL.mp4`, note: 'Del Norte High School' },
  { title: 'Football Season Hype', src: `${OLD_SITE}/FOOTBALL%20HYPE%20EDIT.mp4`, note: 'Del Norte High School' },
  { title: 'Basketball Hype Edit', src: `${OLD_SITE}/BASKETBALL%20HYPE%20EDIT.mp4`, note: 'Del Norte High School' },
  { title: 'Military Night Tribute', src: `${OLD_SITE}/MILITARY_NIGHT.mp4`, note: 'Del Norte High School' },
  { title: 'Football Intro Sequence', src: `${OLD_SITE}/FOOTBALL%20INTRO.mp4`, note: 'Del Norte High School' },
  { title: 'Wedding Cinematography', src: `${OLD_SITE}/Wedding%20Video%20FINAL%20FINAL.mov`, note: 'Wedding film' },
]
