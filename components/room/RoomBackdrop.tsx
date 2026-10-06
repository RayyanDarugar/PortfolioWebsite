import Image from 'next/image'

/** The room, blurred and darkened, filling the bands around it: the art is
 *  wider than most screens, and the bands should feel like the same room. */
export function RoomBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <Image
        src="/room/base.png"
        alt=""
        fill
        sizes="40vw"
        className="scale-110 object-cover"
        style={{ filter: 'blur(26px) brightness(.5) saturate(1.1)' }}
      />
    </div>
  )
}
