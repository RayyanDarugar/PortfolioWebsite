import { formatPricePerImpression, pricePerImpression } from '@/lib/model/payout'
import { OSWindow } from '../OSWindow'
import { INK, WELL } from '../chrome'
import { REPORT_FIELDS, REPORT_ROWS, SURFACES, clearingCpm, surfaceById } from '../adData'
import { AppHeading, Eyebrow, Segmented } from '../parts'

/** Spend is derived, never typed: impressions × the surface's own clearing
 *  price, which is the same arithmetic the settlement runs. A report whose
 *  spend column was hand-written would be the one thing on this window that
 *  could not survive being checked. */
function spendFor(impressions: number, surfaceId: string): number {
  const surface = surfaceById(surfaceId)
  if (!surface) return 0
  return impressions * pricePerImpression(clearingCpm(surface))
}

/** The top surface, whose price the closing line quotes. Taken off the end of
 *  the list rather than looked up by id, so it stays the highest-intensity one
 *  if a fourth surface is ever added above it. */
const TOP_SURFACE = SURFACES[SURFACES.length - 1]

const TOTAL_IMPRESSIONS = REPORT_ROWS.reduce((sum, row) => sum + row.impressions, 0)
const TOTAL_SPEND = REPORT_ROWS.reduce((sum, row) => sum + spendFor(row.impressions, row.surfaceId), 0)

/**
 * App 6 on the advertiser account.
 *
 * The other account's Privacy & Security answers *what can this software see
 * on my machine.* This one answers the buyer's version, which is a different
 * question and has a harder answer: **what do I get, and is it enough to be
 * worth buying without being enough to be a liability.**
 *
 * So it does not argue. It shows the file. Every row an advertiser receives
 * is on screen, aggregate, with the columns that are in it and the columns
 * that are not listed underneath — and the ones that are not are not
 * "off by default" or "available on request". There is no per-person row for
 * them to be aggregated from.
 *
 * That is the trade being offered and it is stated plainly: you lose the
 * ability to follow one person around, and you get an audience that told you
 * who they are.
 */
export function AdPrivacyApp() {
  return (
    <OSWindow
      title="Privacy & Security"
      subtitle="Delivery report"
      toolbar={
        <>
          <Segmented items={['Report', 'Schema', 'Retention', 'Contracts']} active="Report" />
          <span className="ml-auto text-[11.5px] font-bold uppercase tracking-[.08em] text-[#8A94A2]">
            delivery-2026-07.csv
          </span>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-wrap gap-[clamp(20px,2.2vw,36px)] p-[clamp(22px,2.4vw,38px)]">
        <div className="min-w-[320px] flex-[1.1_1_400px]">
          <AppHeading>This file is the whole of what you receive.</AppHeading>
          <p className="mt-[14px] max-w-[52ch] text-[15px] leading-[1.55]" style={{ color: INK.body }}>
            Aggregate rows, one per surface per day. No pixel goes on your site, no SDK goes in your
            product, and nothing here can be joined to a person — not because the join is forbidden,
            but because there is no per-person row for it to join to.
          </p>

          <div className="mt-[20px] overflow-hidden rounded-[10px]"
               style={{ border: '1px solid rgba(20,26,34,.16)', boxShadow: 'inset 0 1px 3px rgba(20,26,34,.08)' }}>
            <table className="w-full border-collapse text-left" style={{ fontFamily: 'var(--font-ui)' }}>
              <thead>
                <tr className="text-[10.5px] font-bold uppercase tracking-[.08em] text-[#7A8593]"
                    style={{
                      background: 'linear-gradient(#F4F7FA,#E8EDF3)',
                      borderBottom: '1px solid rgba(20,26,34,.13)',
                    }}>
                  <th className="px-[12px] py-[8px] font-bold">Day</th>
                  <th className="px-[12px] py-[8px] font-bold">Surface</th>
                  <th className="px-[12px] py-[8px] text-right font-bold">Impressions</th>
                  <th className="px-[12px] py-[8px] text-right font-bold">Dwell</th>
                  <th className="px-[12px] py-[8px] text-right font-bold">CPM</th>
                  <th className="px-[12px] py-[8px] text-right font-bold">Spend</th>
                </tr>
              </thead>
              <tbody>
                {REPORT_ROWS.map((row, i) => {
                  const surface = surfaceById(row.surfaceId)
                  return (
                    <tr key={`${row.day}-${row.surfaceId}`}
                        style={{
                          background: i % 2 ? 'rgba(20,26,34,.028)' : 'transparent',
                          borderBottom: '1px solid rgba(20,26,34,.06)',
                        }}>
                      <td className="tabular px-[12px] py-[8px] text-[12px] text-[#5C6875]">{row.day}</td>
                      <td className="px-[12px] py-[8px] text-[12.5px] font-bold text-[#26313D]">
                        {surface?.name ?? row.surfaceId}
                      </td>
                      <td className="tabular px-[12px] py-[8px] text-right text-[12.5px] text-[#26313D]">
                        {row.impressions.toLocaleString('en-US')}
                      </td>
                      <td className="tabular px-[12px] py-[8px] text-right text-[12.5px] text-[#5C6875]">
                        {row.dwellSeconds.toFixed(1)}s
                      </td>
                      <td className="tabular px-[12px] py-[8px] text-right text-[12.5px] text-[#5C6875]">
                        ${surface ? clearingCpm(surface).toFixed(2) : '—'}
                      </td>
                      <td className="tabular px-[12px] py-[8px] text-right text-[12.5px] font-bold text-[#26313D]">
                        ${spendFor(row.impressions, row.surfaceId).toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{
                  background: 'linear-gradient(#F4F7FA,#E7ECF3)',
                  borderTop: '1px solid rgba(20,26,34,.14)',
                }}>
                  <td className="px-[12px] py-[9px] text-[11px] font-bold uppercase tracking-[.08em] text-[#7A8593]"
                      colSpan={2}>
                    Two days
                  </td>
                  <td className="tabular px-[12px] py-[9px] text-right text-[13px] font-bold text-[#26313D]">
                    {TOTAL_IMPRESSIONS.toLocaleString('en-US')}
                  </td>
                  <td />
                  <td />
                  <td className="tabular px-[12px] py-[9px] text-right text-[13px] font-bold text-[#5FAF00]">
                    ${TOTAL_SPEND.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-[16px]">
            <Eyebrow>
              Spend is impressions × the surface&rsquo;s clearing price. It is the settlement,
              not a summary of it.
            </Eyebrow>
          </div>
        </div>

        {/* The schema, both halves of it. */}
        <div className="flex min-w-[290px] flex-[1_1_330px] flex-col p-[16px_18px]" style={WELL}>
          <div className="flex items-baseline gap-[9px]">
            <b className="text-[15px] font-bold text-[#26313D]">Every column, and every column that is not</b>
          </div>
          <p className="mt-[5px] text-[12.5px] leading-[1.45]" style={{ color: INK.dim }}>
            The second list is the claim. An advertiser who cannot see what is missing has to take
            the first list on trust.
          </p>

          <ul className="mt-[14px] space-y-[9px]">
            {REPORT_FIELDS.map((field) => (
              <li key={field.name} className="flex gap-[10px]">
                <span
                  aria-hidden
                  className="mt-[2px] flex h-[16px] w-[16px] flex-none items-center justify-center rounded-[4px]"
                  style={{
                    background: field.included ? '#5FBE00' : '#C3CBD5',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.45)',
                  }}
                >
                  <svg viewBox="0 0 12 12" className="h-[10px] w-[10px]" fill="none" stroke="#fff"
                       strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    {field.included ? <path d="M2.6 6.2 5 8.6 9.4 3.6" /> : <path d="M3.4 3.4 8.6 8.6M8.6 3.4 3.4 8.6" />}
                  </svg>
                </span>
                <span className="min-w-0">
                  <code className="tabular text-[12.5px] font-bold"
                        style={{ color: field.included ? '#26313D' : '#8A94A2' }}>
                    {field.name}
                  </code>
                  <span className="mt-[2px] block text-[12px] leading-[1.42]"
                        style={{ color: field.included ? INK.body : '#8A94A2' }}>
                    {field.detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-auto pt-[14px] text-[12.5px] leading-[1.5]" style={{ color: INK.body }}>
            You give up following one person from site to site. You get an audience that stated its
            role, its stack and its budget authority before your first impression ran.{' '}
            <b className="font-bold text-[#26313D]">
              {formatPricePerImpression(pricePerImpression(clearingCpm(TOP_SURFACE)))}
            </b>{' '}
            an impression is the price of the second thing, not the first.
          </p>
        </div>
      </div>
    </OSWindow>
  )
}
