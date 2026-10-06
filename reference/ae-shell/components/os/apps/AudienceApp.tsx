'use client'
import { useMemo, useState } from 'react'
import { OSWindow } from '../OSWindow'
import { INK, WELL } from '../chrome'
import {
  COHORTS, COHORT_SHARE_TOTAL, FACETS, FACET_LABELS, FACET_VALUES, TOOLS,
  type Cohort, type Facet,
} from '../adData'
import { type CampaignPlan, PANEL_SIZE_SEATS, reachesFullPanel, seatsFor } from '../campaign'
import { AppHeading, Segmented } from '../parts'

/** The active filter: a set of chosen values per declared field, plus the
 *  tools filter, which is the one that matches on *any* rather than on all —
 *  a person who declared AI chat and Docs & notes is reachable by an AI chat
 *  campaign. */
interface Filter {
  facets: Partial<Record<Facet, ReadonlySet<string>>>
  tools: ReadonlySet<string>
}

const EMPTY: Filter = { facets: {}, tools: new Set() }

function matches(cohort: Cohort, filter: Filter): boolean {
  for (const facet of FACETS) {
    const chosen = filter.facets[facet]
    if (chosen && chosen.size > 0 && !chosen.has(cohort[facet])) return false
  }
  if (filter.tools.size > 0 && !cohort.tools.some((tool) => filter.tools.has(tool))) return false
  return true
}

function shareOf(cohorts: readonly Cohort[]): number {
  return cohorts.reduce((sum, cohort) => sum + cohort.share, 0)
}

function toggle(set: ReadonlySet<string>, value: string): ReadonlySet<string> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

/** One clickable facet value with the share it carries under the rest of the
 *  filter. The count is recomputed against the *other* filters rather than
 *  against the whole panel, which is what makes it an inspector instead of a
 *  legend: it tells you what selecting this would actually do next. */
function FacetRow({
  label, on, share, seats, onClick,
}: { label: string; on: boolean; share: number; seats: number; onClick: () => void }) {
  const dead = share === 0
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      disabled={dead && !on}
      className="flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[5px] text-left disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2E7FE0]"
      style={{
        fontFamily: 'var(--font-ui)',
        background: on ? 'linear-gradient(#5DA9F6,#1F6FD0)' : 'transparent',
        color: on ? '#fff' : '#3B4756',
        boxShadow: on ? 'inset 0 1px 0 rgba(255,255,255,.35), 0 1px 3px rgba(16,50,110,.35)' : 'none',
      }}
    >
      <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold">{label}</span>
      <span className="tabular flex-none text-[11.5px]"
            style={{ color: on ? 'rgba(255,255,255,.82)' : '#8A94A2' }}>
        {seats.toLocaleString('en-US')}
      </span>
      <span className="tabular w-[4.5ch] flex-none text-right text-[11px]"
            style={{ color: on ? 'rgba(255,255,255,.62)' : '#A6B0BC' }}>
        {(share * 100).toFixed(0)}%
      </span>
    </button>
  )
}

/**
 * App 3 on the advertiser account: the audience inspector, and the asset.
 *
 * The whole product argument for this exchange is that the targeting is
 * *declared* — what they do, what stage they're at, the setting they work
 * in, which AI tools they actually use, and whether they can sign a purchase
 * order, all stated at install, before any ad ever rendered against them.
 * That is a sentence anybody can write. This window is the version of it you
 * can click on: every facet filters the panel, every count moves, and the
 * seat numbers on the right are this plan's budget landing on this slice of
 * it.
 *
 * The shares are the panel's composition. The seats are derived from the
 * campaign the previous window built — so the number an advertiser reads here
 * is *their* reach, not a panel size this site is not in a position to
 * publish.
 */
export function AudienceApp({ plan }: { plan: CampaignPlan }) {
  const [filter, setFilter] = useState<Filter>(EMPTY)

  const selected = useMemo(() => COHORTS.filter((cohort) => matches(cohort, filter)), [filter])
  const share = shareOf(selected)
  const totalSeats = seatsFor(plan)
  const seats = Math.round(totalSeats * (share / COHORT_SHARE_TOTAL))
  const active =
    FACETS.reduce((n, facet) => n + (filter.facets[facet]?.size ?? 0), 0) + filter.tools.size

  /**
   * The share one facet value carries with every *other* filter held.
   *
   * Deliberately computed against this facet narrowed to exactly this value
   * rather than against the current multi-selection, so a column with three
   * roles ticked still says which of the three is doing the work — which is
   * the difference between an inspector and a legend.
   */
  const shareWith = (facet: Facet, value: string): number => {
    const next: Filter = { ...filter, facets: { ...filter.facets, [facet]: new Set([value]) } }
    return shareOf(COHORTS.filter((cohort) => matches(cohort, next)))
  }

  const shareWithTool = (tool: string): number => {
    const next: Filter = { ...filter, tools: new Set([tool]) }
    return shareOf(COHORTS.filter((cohort) => matches(cohort, next)))
  }

  const seatsFromShare = (value: number) =>
    Math.round(totalSeats * (value / COHORT_SHARE_TOTAL))

  return (
    <OSWindow
      title="Audience"
      subtitle="Declared"
      toolbar={
        <>
          <Segmented items={['Declared', 'Modelled', 'Lookalike', 'Retargeted']} active="Declared" />
          <span className="ml-auto flex items-center gap-[7px] text-[11.5px] font-bold uppercase tracking-[.08em] text-[#8A94A2]">
            {active === 0 ? 'Whole panel' : `${active} filter${active === 1 ? '' : 's'}`}
          </span>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-wrap">
        {/* The facets */}
        <div
          className="min-w-[280px] flex-[1_1_320px] overflow-hidden p-[14px]"
          style={{
            background: 'linear-gradient(#F1F4F9,#E6EBF2)',
            borderRight: '1px solid rgba(20,26,34,.13)',
          }}
        >
          <div className="flex items-center justify-between px-[8px] pb-[8px]">
            <span className="text-[11px] font-bold uppercase tracking-[.09em] text-[#8A94A2]"
                  style={{ fontFamily: 'var(--font-ui)' }}>
              Filter
            </span>
            <button
              type="button"
              onClick={() => setFilter(EMPTY)}
              disabled={active === 0}
              className="rounded-[5px] px-[7px] py-[2px] text-[11.5px] font-bold text-[#2E7FE0] disabled:opacity-35 hover:bg-white/70 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#2E7FE0]"
              style={{ fontFamily: 'var(--font-ui)' }}
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-[14px] gap-y-[10px]">
            {FACETS.map((facet) => (
              <div key={facet} className="min-w-0">
                <div className="px-[8px] pb-[3px] text-[10.5px] font-bold uppercase tracking-[.08em] text-[#A6B0BC]"
                     style={{ fontFamily: 'var(--font-ui)' }}>
                  {FACET_LABELS[facet]}
                </div>
                {FACET_VALUES[facet].map((value) => {
                  const valueShare = shareWith(facet, value)
                  return (
                    <FacetRow
                      key={value}
                      label={value}
                      on={filter.facets[facet]?.has(value) ?? false}
                      share={valueShare}
                      seats={seatsFromShare(valueShare)}
                      onClick={() =>
                        setFilter((was) => ({
                          ...was,
                          facets: {
                            ...was.facets,
                            [facet]: toggle(was.facets[facet] ?? new Set(), value),
                          },
                        }))
                      }
                    />
                  )
                })}
              </div>
            ))}

            <div className="col-span-2 min-w-0">
              <div className="px-[8px] pb-[3px] text-[10.5px] font-bold uppercase tracking-[.08em] text-[#A6B0BC]"
                   style={{ fontFamily: 'var(--font-ui)' }}>
                Tools — matches any
              </div>
              <div className="flex flex-wrap gap-[5px] px-[8px]">
                {TOOLS.map((tool) => {
                  const on = filter.tools.has(tool)
                  const toolShare = shareWithTool(tool)
                  return (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => setFilter((was) => ({ ...was, tools: toggle(was.tools, tool) }))}
                      aria-pressed={on}
                      disabled={toolShare === 0 && !on}
                      className="rounded-full px-[10px] py-[4px] text-[11.5px] font-bold disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2E7FE0]"
                      style={{
                        fontFamily: 'var(--font-ui)',
                        background: on
                          ? 'linear-gradient(var(--color-money-hi),var(--color-money-lo))'
                          : 'linear-gradient(#FFFFFF,#E9EEF4)',
                        color: on ? '#183300' : '#3B4756',
                        border: `1px solid ${on ? 'var(--color-money-lo)' : 'rgba(20,26,34,.20)'}`,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.85)',
                      }}
                    >
                      {tool}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* The selection */}
        <div className="flex min-w-[320px] flex-[1.1_1_380px] flex-col p-[clamp(20px,2.2vw,34px)]">
          <AppHeading>They told us who they are. Nothing here was inferred.</AppHeading>
          <p className="mt-[14px] max-w-[50ch] text-[14.5px] leading-[1.55]" style={{ color: INK.body }}>
            What they do, what stage they&rsquo;re at, the setting they work in, which AI tools are
            actually open on their screen, and whether they can sign a purchase order — declared
            at install, before a single ad had ever rendered against them. No cookie built this.
            No lookalike model extended it. It is the field open-web display never had, and it is
            the reason a slot here is worth more than one anywhere else.
          </p>

          {/* Two figures, two denominators, on purpose kept apart: the seat
              count is this plan's reach, and the percentage beside it is that
              same seat count measured against the one fixed thing on the
              page — the declared panel `/exchange` already publishes as
              `FLEET_DECLARED_INSTALLS`. Dividing the two numbers in this well
              must always recover `PANEL_SIZE_SEATS`, whatever the budget or
              the filter; that used to recover the *filter's* composition
              share instead, which is a different denominator wearing the
              same label. */}
          <div className="mt-[20px] flex flex-wrap items-end gap-x-[clamp(20px,2.4vw,40px)] gap-y-4 p-[16px_20px]"
               style={WELL}>
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[.09em] text-[#8A94A2]"
                   style={{ fontFamily: 'var(--font-ui)' }}>
                Seats this plan reaches
              </div>
              <div className="tabular mt-[6px] text-[clamp(30px,2.8vw,42px)] font-bold leading-none tracking-[-.035em] text-[#5FAF00]">
                {seats.toLocaleString('en-US')}
              </div>
            </div>
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[.09em] text-[#8A94A2]"
                   style={{ fontFamily: 'var(--font-ui)' }}>
                Of the declared {PANEL_SIZE_SEATS.toLocaleString('en-US')}-seat panel
              </div>
              <div className="tabular mt-[6px] text-[clamp(24px,2vw,30px)] font-bold leading-none tracking-[-.03em] text-[#26313D]">
                {((seats / PANEL_SIZE_SEATS) * 100).toFixed(1)}%
              </div>
            </div>
            <p className="min-w-[22ch] flex-1 text-[12.5px] leading-[1.45]" style={{ color: INK.dim }}>
              {active === 0
                ? reachesFullPanel(plan)
                  ? 'Your budget now reaches every declared seat. More money buys frequency, not more people.'
                  : 'No filter. Every declared seat your budget can reach at this frequency.'
                : `${selected.length} of ${COHORTS.length} declared cohorts match — ${((share / COHORT_SHARE_TOTAL) * 100).toFixed(1)}% of the panel's composition.`}
            </p>
          </div>

          {/* The cohorts themselves. A table rather than a chart: an advertiser
              checking whether their ICP is in here wants to read the rows, not
              estimate them off a bar. */}
          <div className="mt-[18px] min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse text-left" style={{ fontFamily: 'var(--font-ui)' }}>
              <thead>
                <tr className="text-[10.5px] font-bold uppercase tracking-[.08em] text-[#7A8593]"
                    style={{ borderBottom: '1px solid rgba(20,26,34,.16)' }}>
                  <th className="py-[7px] pr-3 font-bold">What they do</th>
                  <th className="py-[7px] pr-3 font-bold">Stage</th>
                  <th className="py-[7px] pr-3 font-bold">Setting</th>
                  <th className="py-[7px] pr-3 font-bold">Tools</th>
                  <th className="py-[7px] pr-3 font-bold">Buying authority</th>
                  <th className="py-[7px] text-right font-bold">Seats</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((cohort, i) => (
                  <tr
                    key={`${cohort.role}-${cohort.stage}-${cohort.setting}-${cohort.tools.join(',')}`}
                    style={{
                      background: i % 2 ? 'rgba(20,26,34,.028)' : 'transparent',
                      borderBottom: '1px solid rgba(20,26,34,.06)',
                    }}
                  >
                    <td className="py-[7px] pr-3 text-[12.5px] font-bold text-[#26313D]">{cohort.role}</td>
                    <td className="py-[7px] pr-3 text-[12.5px] text-[#5C6875]">{cohort.stage}</td>
                    <td className="tabular py-[7px] pr-3 text-[12.5px] text-[#5C6875]">{cohort.setting}</td>
                    {/* Tools earns a column of its own: it is the field that
                        makes this panel different from an open-web segment,
                        and without it two cohorts that declared the same role,
                        stage and setting render as identical rows carrying
                        different seat counts — which reads as the table
                        contradicting itself rather than as two real groups. */}
                    <td className="py-[7px] pr-3 text-[12px] text-[#5C6875]">{cohort.tools.join(', ')}</td>
                    <td className="py-[7px] pr-3 text-[12px]"
                        style={{ color: cohort.authority === 'Approves spend' ? '#4E9200' : '#7A8593' }}>
                      {cohort.authority}
                    </td>
                    <td className="tabular py-[7px] text-right text-[12.5px] font-bold text-[#26313D]">
                      {seatsFromShare(cohort.share).toLocaleString('en-US')}
                    </td>
                  </tr>
                ))}
                {selected.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-[16px] text-[13px]" style={{ color: INK.dim }}>
                      Nobody declared that combination. Clear a filter and the panel comes back.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </OSWindow>
  )
}
