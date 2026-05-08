'use client'

import * as React from 'react'

type Item = { name: string; description: string; prices: [number, number] }
type FeatureOpt = { name: string; description: string; price: number }
type Content = {
  section: { title: string; tagline?: string; columns: [string, string]; items: Item[] }
  feature?: { eyebrow: string; name: string; options: FeatureOpt[] }
}

type Props = { value: Content; onChange: (next: Content) => void }

export function PanuozziEditor({ value, onChange }: Props) {
  const set = React.useCallback(
    (patch: (prev: Content) => Content) => onChange(patch(value)),
    [value, onChange]
  )

  return (
    <div className="space-y-5">
      <Field label="Section title">
        <Text
          value={value.section.title}
          onChange={(t) => set((p) => ({ ...p, section: { ...p.section, title: t } }))}
        />
      </Field>
      <Field label="Tagline (optional)">
        <Text
          value={value.section.tagline ?? ''}
          onChange={(t) => set((p) => ({ ...p, section: { ...p.section, tagline: t } }))}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Column 1 label">
          <Text
            value={value.section.columns[0]}
            onChange={(t) =>
              set((p) => ({
                ...p,
                section: { ...p.section, columns: [t, p.section.columns[1]] },
              }))
            }
          />
        </Field>
        <Field label="Column 2 label">
          <Text
            value={value.section.columns[1]}
            onChange={(t) =>
              set((p) => ({
                ...p,
                section: { ...p.section, columns: [p.section.columns[0], t] },
              }))
            }
          />
        </Field>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Items</h3>
          <button
            type="button"
            onClick={() =>
              set((p) => ({
                ...p,
                section: {
                  ...p.section,
                  items: [...p.section.items, { name: '', description: '', prices: [0, 0] }],
                },
              }))
            }
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Add item
          </button>
        </div>
        <div className="space-y-3">
          {value.section.items.map((item, i) => (
            <ItemRow
              key={i}
              item={item}
              col1={value.section.columns[0]}
              col2={value.section.columns[1]}
              onChange={(next) =>
                set((p) => ({
                  ...p,
                  section: {
                    ...p.section,
                    items: p.section.items.map((it, j) => (j === i ? next : it)),
                  },
                }))
              }
              onDelete={() =>
                set((p) => ({
                  ...p,
                  section: {
                    ...p.section,
                    items: p.section.items.filter((_, j) => j !== i),
                  },
                }))
              }
              onMoveUp={
                i === 0
                  ? null
                  : () =>
                      set((p) => {
                        const items = [...p.section.items]
                        ;[items[i - 1], items[i]] = [items[i], items[i - 1]]
                        return { ...p, section: { ...p.section, items } }
                      })
              }
              onMoveDown={
                i === value.section.items.length - 1
                  ? null
                  : () =>
                      set((p) => {
                        const items = [...p.section.items]
                        ;[items[i], items[i + 1]] = [items[i + 1], items[i]]
                        return { ...p, section: { ...p.section, items } }
                      })
              }
            />
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Feature band (optional)</h3>
          {value.feature ? (
            <button
              type="button"
              onClick={() => set((p) => ({ ...p, feature: undefined }))}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remove band
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                set((p) => ({
                  ...p,
                  feature: {
                    eyebrow: 'Feature',
                    name: 'Feature',
                    options: [{ name: '', description: '', price: 0 }],
                  },
                }))
              }
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              + Add band
            </button>
          )}
        </div>

        {value.feature ? (
          <div className="space-y-3 bg-amber-50/50 border border-amber-200/70 rounded p-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Eyebrow">
                <Text
                  value={value.feature.eyebrow}
                  onChange={(t) =>
                    set((p) => ({ ...p, feature: { ...p.feature!, eyebrow: t } }))
                  }
                />
              </Field>
              <Field label="Name">
                <Text
                  value={value.feature.name}
                  onChange={(t) =>
                    set((p) => ({ ...p, feature: { ...p.feature!, name: t } }))
                  }
                />
              </Field>
            </div>
            <div className="space-y-2">
              {value.feature.options.map((opt, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_90px_auto] gap-2 items-end">
                  <Field label={i === 0 ? 'Option name' : ''}>
                    <Text
                      value={opt.name}
                      onChange={(t) =>
                        set((p) => ({
                          ...p,
                          feature: {
                            ...p.feature!,
                            options: p.feature!.options.map((o, j) => (j === i ? { ...o, name: t } : o)),
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label={i === 0 ? 'Description' : ''}>
                    <Text
                      value={opt.description}
                      onChange={(t) =>
                        set((p) => ({
                          ...p,
                          feature: {
                            ...p.feature!,
                            options: p.feature!.options.map((o, j) => (j === i ? { ...o, description: t } : o)),
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label={i === 0 ? 'Price' : ''}>
                    <NumberInput
                      value={opt.price}
                      onChange={(n) =>
                        set((p) => ({
                          ...p,
                          feature: {
                            ...p.feature!,
                            options: p.feature!.options.map((o, j) => (j === i ? { ...o, price: n } : o)),
                          },
                        }))
                      }
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() =>
                      set((p) => ({
                        ...p,
                        feature: {
                          ...p.feature!,
                          options: p.feature!.options.filter((_, j) => j !== i),
                        },
                      }))
                    }
                    className="text-xs text-red-500 hover:text-red-700 mb-1.5"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  set((p) => ({
                    ...p,
                    feature: {
                      ...p.feature!,
                      options: [...p.feature!.options, { name: '', description: '', price: 0 }],
                    },
                  }))
                }
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                + Add option
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ItemRow({
  item,
  col1,
  col2,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  item: Item
  col1: string
  col2: string
  onChange: (next: Item) => void
  onDelete: () => void
  onMoveUp: (() => void) | null
  onMoveDown: (() => void) | null
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-2">
      <div className="grid grid-cols-[1fr_90px_90px_auto] gap-2 items-end">
        <Field label="Name">
          <Text value={item.name} onChange={(t) => onChange({ ...item, name: t })} />
        </Field>
        <Field label={col1 || 'P1'}>
          <NumberInput value={item.prices[0]} onChange={(n) => onChange({ ...item, prices: [n, item.prices[1]] })} />
        </Field>
        <Field label={col2 || 'P2'}>
          <NumberInput value={item.prices[1]} onChange={(n) => onChange({ ...item, prices: [item.prices[0], n] })} />
        </Field>
        <div className="flex flex-col gap-0.5 mb-1">
          <button
            type="button"
            onClick={onMoveUp ?? undefined}
            disabled={!onMoveUp}
            className="text-xs text-gray-400 hover:text-black disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown ?? undefined}
            disabled={!onMoveDown}
            className="text-xs text-gray-400 hover:text-black disabled:opacity-30"
          >
            ↓
          </button>
        </div>
      </div>
      <Field label="Description">
        <Text value={item.description} onChange={(t) => onChange({ ...item, description: t })} />
      </Field>
      <div className="text-right">
        <button type="button" onClick={onDelete} className="text-xs text-red-500 hover:text-red-700">
          Delete item
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      {label ? (
        <span className="block text-[11px] font-medium text-gray-600 mb-1">{label}</span>
      ) : null}
      {children}
    </label>
  )
}

function Text({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-black focus:ring-1 focus:ring-black"
    />
  )
}

function NumberInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [text, setText] = React.useState(value.toString())
  React.useEffect(() => {
    setText(value.toString())
  }, [value])
  return (
    <input
      type="number"
      step="0.01"
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        const n = parseFloat(e.target.value)
        if (!Number.isNaN(n)) onChange(n)
      }}
      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-black focus:ring-1 focus:ring-black"
    />
  )
}
