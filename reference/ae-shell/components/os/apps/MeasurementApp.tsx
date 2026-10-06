import { CPM_KICKBACKS_TOP4 } from '@/lib/model/figures'
import { formatPricePerImpression, pricePerImpression } from '@/lib/model/payout'
import { OSWindow } from '../OSWindow'
import { INK, WELL } from '../chrome'
import { MEASUREMENT_ROWS, VERIFICATION_STEPS } from '../adData'
import { type CampaignPlan, blendedCpm, pricePerImpressionFor } from '../campaign'
import { AppHeading, Eyebrow, Segmented } from '../parts'

/**
 * App 5 on the advertiser account: what an impression means here.
 *
 * Every media buyer has been sold viewability before, and every one of them
 * knows the standard is half the pixels for one second in a tab that might be
 * behind another window. The claim this exchange makes is that its unit is
 * measured differently — and a claim about measurement is worth nothing said
 * as an adjective, so this window states the rule, prints the comparison, and
 * then shows the order the verification happens in.
 *
 * The order is the argument. The rectangle is verified empty *before* the slot
 * is offered, which means there is no way to sell space that was not there.
 * Everywhere else, the check — where it exists at all — happens after the
 * impression has already been billed.
 */
export function MeasurementApp({ plan }: { plan: CampaignPlan }) {
  const here = pricePerImpressionFor(plan)
  const observed = pricePerImpression(CPM_KICKBACKS_TOP4.value)

  return (
    <OSWindow
      title="Measurement"
      subtitle="Definition"
      toolbar={
        <>
          <Segmented items={['Definition', 'Verification', 'Discrepancy', 'Export']} active="Definition" />
          <span className="ml-auto text-[11.5px] font-bold uppercase tracking-[.08em] text-[#8A94A2]">
            One impression
          </span>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-wrap gap-[clamp(20px,2.2vw,36px)] p-[clamp(22px,2.4vw,38px)]">
        <div className="min-w-[320px] flex-[1.15_1_400px]">
          <AppHeading>An impression here is the whole unit, or it is nothing.</AppHeading>
          <p className="mt-[14px] max-w-[52ch] text-[15px] leading-[1.55]" style={{ color: INK.body }}>
            Fully on screen, unobstructed, on the display the person is working on, for longer than
            the dwell threshold, once per person per cap. Anything short of that is not counted and
            not billed. There is no partial credit and there is no blended average hiding one behind
            the other.
          </p>

          {/* The comparison. */}
          <table className="mt-[20px] w-full border-collapse text-left"
                 style={{ fontFamily: 'var(--font-ui)' }}>
            <thead>
              <tr className="text-[10.5px] font-bold uppercase tracking-[.08em] text-[#7A8593]"
                  style={{
                    background: 'linear-gradient(#F4F7FA,#E8EDF3)',
                    borderTop: '1px solid rgba(20,26,34,.13)',
                    borderBottom: '1px solid rgba(20,26,34,.13)',
                  }}>
                <th className="w-[26%] px-[12px] py-[8px] font-bold">&nbsp;</th>
                <th className="px-[12px] py-[8px] font-bold">Standard display</th>
                <th className="px-[12px] py-[8px] font-bold" style={{ background: 'rgba(95,175,0,.09)' }}>
                  This exchange
                </th>
              </tr>
            </thead>
            <tbody>
              {MEASUREMENT_ROWS.map((row, i) => (
                <tr key={row.dimension}
                    style={{
                      background: i % 2 ? 'rgba(20,26,34,.028)' : 'transparent',
                      borderBottom: '1px solid rgba(20,26,34,.07)',
                    }}>
                  <td className="px-[12px] py-[9px] align-top text-[12.5px] font-bold text-[#26313D]">
                    {row.dimension}
                  </td>
                  <td className="px-[12px] py-[9px] align-top text-[12.5px] leading-[1.45] text-[#8A94A2]">
                    {row.elsewhere}
                  </td>
                  <td className="px-[12px] py-[9px] align-top text-[12.5px] leading-[1.45] text-[#26313D]"
                      style={{ background: 'rgba(95,175,0,.06)' }}>
                    {row.here}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* The two prices, side by side, because a measurement argument that
              does not end at a price is a measurement argument nobody buys. */}
          <div className="mt-[20px] flex flex-wrap items-end gap-x-[clamp(20px,2.4vw,40px)] gap-y-4 p-[16px_20px]"
               style={WELL}>
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[.09em] text-[#8A94A2]"
                   style={{ fontFamily: 'var(--font-ui)' }}>
                Your plan, per verified impression
              </div>
              <div className="tabular mt-[6px] text-[28px] font-bold leading-none tracking-[-.03em] text-[#5FAF00]">
                {formatPricePerImpression(here)}
              </div>
              <div className="tabular mt-[6px] text-[11.5px] text-[#7A8593]"
                   style={{ fontFamily: 'var(--font-ui)' }}>
                blended ${blendedCpm(plan).toFixed(2)} CPM
              </div>
            </div>
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[.09em] text-[#8A94A2]"
                   style={{ fontFamily: 'var(--font-ui)' }}>
                The nearest observed market
              </div>
              <div className="tabular mt-[6px] text-[28px] font-bold leading-none tracking-[-.03em] text-[#26313D]">
                {formatPricePerImpression(observed)}
              </div>
              <div className="tabular mt-[6px] text-[11.5px] text-[#7A8593]"
                   style={{ fontFamily: 'var(--font-ui)' }}>
                ${CPM_KICKBACKS_TOP4.value.toFixed(2)} CPM, top four bidders
              </div>
            </div>
            <p className="min-w-[24ch] flex-1 text-[12.5px] leading-[1.5]" style={{ color: INK.dim }}>
              Different unit, different price. Price a test against what it clears, not against
              either rate card.
            </p>
          </div>
        </div>

        {/* The chain */}
        <div className="flex min-w-[280px] flex-[1_1_320px] flex-col gap-[10px]">
          <Eyebrow>How one impression is verified, in order</Eyebrow>
          {VERIFICATION_STEPS.map((step, i) => (
            <div key={step.title} className="flex gap-[12px] p-[14px_16px]" style={WELL}>
              <span
                aria-hidden
                className="tabular flex h-[24px] w-[24px] flex-none items-center justify-center rounded-full text-[12px] font-bold"
                style={{
                  background: 'linear-gradient(var(--color-money-hi),var(--color-money-lo))',
                  color: '#183300',
                  border: '1px solid var(--color-money-lo)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.8)',
                }}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <b className="block text-[13.5px] font-bold leading-[1.3] text-[#26313D]">
                  {step.title}
                </b>
                <p className="mt-[5px] text-[12.5px] leading-[1.45]" style={{ color: INK.body }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
          <p className="mt-[2px] text-[12px] leading-[1.5]" style={{ color: INK.dim }}>
            Every row of the delivery report traces to one of these records. It is the same row you
            are billed on, which is what makes a discrepancy something either of us can look up
            rather than argue about.
          </p>
        </div>
      </div>
    </OSWindow>
  )
}
