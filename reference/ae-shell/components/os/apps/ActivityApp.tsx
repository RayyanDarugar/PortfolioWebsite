import { IMPRESSIONS_PER_USER_DAY } from '@/lib/model/figures'
import { OSWindow } from '../OSWindow'
import { INK } from '../chrome'
import {
  WAIT_CURVE, WAIT_CURVE_START_HOUR, WAIT_MINUTES_TOTAL, WAIT_ROWS,
  WORKING_DAY_MINUTES, formatDuration,
} from '../data'
import { AppHeading, AreaChart, Segmented } from '../parts'

const MAX_ROW = Math.max(...WAIT_ROWS.map((r) => r.minutes))
const SHARE_OF_DAY = (WAIT_MINUTES_TOTAL / WORKING_DAY_MINUTES) * 100

/**
 * App 2. Activity Monitor, showing the one resource the real one does not
 * measure. The window is built like the real app — a tab strip, a sortable-
 * looking table with a highlighted sort column, and a footer band with the
 * totals and a live graph — because the specificity is what makes the joke
 * land as an explanation rather than as a skin.
 */
export function ActivityApp() {
  return (
    <OSWindow
      title="Activity Monitor"
      subtitle="All processes"
      toolbar={
        <>
          <Segmented items={['CPU', 'Memory', 'Energy', 'Attention', 'Disk']} active="Attention" />
          <span className="ml-auto text-[11.5px] font-bold uppercase tracking-[.08em] text-[#8A94A2]">
            Today
          </span>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="px-[clamp(24px,2.4vw,38px)] pb-[22px] pt-[clamp(22px,2.2vw,32px)]">
          <AppHeading>
            You spend {formatDuration(WAIT_MINUTES_TOTAL)} a day watching things generate.
          </AppHeading>
          <p className="mt-[16px] max-w-[58ch] text-[15.5px] leading-[1.55]" style={{ color: INK.body }}>
            Not working. Waiting. The model is thinking, the build is running, the export is
            halfway done, and you are looking at a window with nothing in it. Every one of
            those waits is a rectangle of screen doing nothing, and every rectangle is a slot
            somebody will pay to be in.
          </p>
        </div>

        {/* The table. Real Activity Monitor tints its sort column, right-aligns
            every number and rules every row — all three carry information here
            too, so they are kept rather than simplified away. */}
        <table className="w-full border-collapse text-left" style={{ fontFamily: 'var(--font-ui)' }}>
          <thead>
            <tr
              className="text-[11px] font-bold uppercase tracking-[.08em] text-[#7A8593]"
              style={{
                background: 'linear-gradient(#F4F7FA,#E8EDF3)',
                borderTop: '1px solid rgba(20,26,34,.13)',
                borderBottom: '1px solid rgba(20,26,34,.13)',
              }}
            >
              <th className="px-[clamp(24px,2.4vw,38px)] py-[9px] font-bold">Process</th>
              <th className="py-[9px] pr-4 text-right font-bold" style={{ background: 'rgba(46,127,224,.07)' }}>
                Waiting
              </th>
              <th className="py-[9px] pr-4 text-right font-bold">% of day</th>
              <th className="w-[34%] py-[9px] pr-[clamp(24px,2.4vw,38px)] font-bold">Share</th>
            </tr>
          </thead>
          <tbody>
            {WAIT_ROWS.map((row, i) => (
              <tr
                key={row.process}
                style={{
                  background: i % 2 ? 'rgba(20,26,34,.028)' : 'transparent',
                  borderBottom: '1px solid rgba(20,26,34,.07)',
                }}
              >
                <td className="px-[clamp(24px,2.4vw,38px)] py-[9px] text-[13.5px]">
                  <b className="font-bold text-[#26313D]">{row.process}</b>
                  <span className="ml-2 text-[12.5px] text-[#8A94A2]">{row.detail}</span>
                </td>
                <td
                  className="tabular py-[9px] pr-4 text-right text-[13px] font-bold text-[#26313D]"
                  style={{ background: 'rgba(46,127,224,.07)' }}
                >
                  {formatDuration(row.minutes)}
                </td>
                <td className="tabular py-[9px] pr-4 text-right text-[13px] text-[#6C7889]">
                  {((row.minutes / WORKING_DAY_MINUTES) * 100).toFixed(1)}%
                </td>
                <td className="py-[9px] pr-[clamp(24px,2.4vw,38px)]">
                  <span
                    className="block h-[9px] rounded-full"
                    style={{
                      width: `${(row.minutes / MAX_ROW) * 100}%`,
                      background: 'linear-gradient(90deg,#B6FF63,#5FBE00)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55)',
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* The footer band. Activity Monitor's own is a strip of totals with a
            graph pinned to the right of it; this is the same object. */}
        <div
          className="mt-auto flex flex-wrap items-end gap-x-[clamp(24px,3vw,52px)] gap-y-4 px-[clamp(24px,2.4vw,38px)] py-[18px]"
          style={{
            background: 'linear-gradient(#F4F7FA,#E7ECF3)',
            borderTop: '1px solid rgba(20,26,34,.14)',
          }}
        >
          {[
            { k: 'Waiting today', v: formatDuration(WAIT_MINUTES_TOTAL) },
            { k: 'Of an 8-hour day', v: `${SHARE_OF_DAY.toFixed(1)}%` },
            { k: 'Slots it fills', v: String(IMPRESSIONS_PER_USER_DAY.value) },
          ].map((item) => (
            <div key={item.k}>
              <div className="text-[10.5px] font-bold uppercase tracking-[.09em] text-[#8A94A2]"
                   style={{ fontFamily: 'var(--font-ui)' }}>
                {item.k}
              </div>
              <div className="tabular mt-[5px] text-[19px] font-bold leading-none text-[#26313D]">
                {item.v}
              </div>
            </div>
          ))}

          <div className="ml-auto min-w-[220px] flex-1 text-[#2E7FE0]">
            <div className="mb-[6px] flex items-center justify-between text-[10.5px] font-bold uppercase tracking-[.09em] text-[#8A94A2]"
                 style={{ fontFamily: 'var(--font-ui)' }}>
              <span>{WAIT_CURVE_START_HOUR}:00</span>
              <span>Waiting, by hour</span>
              <span>{WAIT_CURVE_START_HOUR + WAIT_CURVE.length - 1}:00</span>
            </div>
            <AreaChart
              values={WAIT_CURVE}
              width={260}
              height={54}
              grid={2}
              stroke="#5FBE00"
              fillFrom="rgba(123,224,0,.42)"
              fillTo="rgba(123,224,0,.02)"
              gradientId="waitFill"
            />
          </div>
        </div>
      </div>
    </OSWindow>
  )
}
