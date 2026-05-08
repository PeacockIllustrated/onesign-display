'use client'

import * as React from 'react'

type ListItem = { name: string; price: number }
type FeatureItem = { name: string; description: string; price: number }

type Quadrant =
  | { kind: 'list'; title: string; items: ListItem[] }
  | { kind: 'grid'; title: string; tagline?: string; items: ListItem[]; spanLastFull?: boolean }
  | { kind: 'feature-pair'; title: string; items: [FeatureItem, FeatureItem] }

type Content = {
  header: { trail: string }
  quadrants: [Quadrant, Quadrant, Quadrant, Quadrant]
}

type Props = { value: Content; onChange: (next: Content) => void }

export function QuadrantEditor({ value, onChange }: Props) {
  const set = React.useCallback(
    (patch: (prev: Content) => Content) => onChange(patch(value)),
    [value, onChange]
  )

  return (
    <div className="space-y-4">
      <Field label="Header trail (italic line under logo)">
        <Text
          value={value.header.trail}
          onChange={(t) => set((p) => ({ ...p, header: { trail: t } }))}
        />
      </Field>

      {([0, 1, 2, 3] as const).map((i) => (
        <QuadrantSection
          key={i}
          index={i}
          q={value.quadrants[i]}
          onChange={(next) =>
            set((p) => {
              const arr = [...p.quadrants] as Content['quadrants']
              arr[i] = next
              return { ...p, quadrants: arr }
            })
          }
        />
      ))}
    </div>
  )
}

function QuadrantSection({
  index,
  q,
  onChange,
}: {
  index: number
  q: Quadrant
  onChange: (next: Quadrant) => void
}) {
  const positions = ['Top-left', 'Top-right', 'Bottom-left', 'Bottom-right']
  return (
    <details open className="bg-gray-50 border border-gray-200 rounded">
      <summary className="px-3 py-2 cursor-pointer text-sm font-semibold text-gray-700 flex items-center justify-between">
        <span>
          {positions[index]} — <span className="font-normal text-gray-500">{q.title || '(untitled)'}</span>
        </span>
        <span className="text-[10px] uppercase tracking-wider text-gray-400">{q.kind}</span>
      </summary>
      <div className="p-3 space-y-3 border-t border-gray-200">
        <div className="grid grid-cols-[1fr_140px] gap-2">
          <Field label="Title">
            <Text value={q.title} onChange={(t) => onChange({ ...q, title: t })} />
          </Field>
          <Field label="Layout">
            <select
              value={q.kind}
              onChange={(e) => onChange(switchKind(q, e.target.value as Quadrant['kind']))}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="list">List (rows)</option>
              <option value="grid">Grid (2-col)</option>
              <option value="feature-pair">Feature pair (2 cards)</option>
            </select>
          </Field>
        </div>

        {q.kind === 'grid' ? (
          <>
            <Field label="Tagline (optional)">
              <Text value={q.tagline ?? ''} onChange={(t) => onChange({ ...q, tagline: t })} />
            </Field>
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={!!q.spanLastFull}
                onChange={(e) => onChange({ ...q, spanLastFull: e.target.checked })}
              />
              Last item spans full width
            </label>
          </>
        ) : null}

        {q.kind === 'list' || q.kind === 'grid' ? (
          <ListItemsEditor
            items={q.items}
            min={1}
            onChange={(items) => onChange({ ...q, items } as Quadrant)}
          />
        ) : null}

        {q.kind === 'feature-pair' ? (
          <FeaturePairEditor
            items={q.items}
            onChange={(items) => onChange({ ...q, items } as Quadrant)}
          />
        ) : null}
      </div>
    </details>
  )
}

function switchKind(q: Quadrant, kind: Quadrant['kind']): Quadrant {
  if (q.kind === kind) return q
  if (kind === 'list') return { kind: 'list', title: q.title, items: extractListItems(q) }
  if (kind === 'grid') return { kind: 'grid', title: q.title, items: extractListItems(q), tagline: '' }
  return {
    kind: 'feature-pair',
    title: q.title,
    items: [
      { name: '', description: '', price: 0 },
      { name: '', description: '', price: 0 },
    ],
  }
}

function extractListItems(q: Quadrant): ListItem[] {
  if (q.kind === 'list' || q.kind === 'grid') return q.items
  return q.items.map((it) => ({ name: it.name, price: it.price }))
}

function ListItemsEditor({
  items,
  min,
  onChange,
}: {
  items: ListItem[]
  min: number
  onChange: (next: ListItem[]) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-600 uppercase tracking-wider">Items</span>
        <button
          type="button"
          onClick={() => onChange([...items, { name: '', price: 0 }])}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          + Add item
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-[1fr_90px_auto] gap-2 items-center">
          <Text
            value={item.name}
            onChange={(t) => onChange(items.map((it, j) => (j === i ? { ...it, name: t } : it)))}
          />
          <NumberInput
            value={item.price}
            onChange={(n) => onChange(items.map((it, j) => (j === i ? { ...it, price: n } : it)))}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            disabled={items.length <= min}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

function FeaturePairEditor({
  items,
  onChange,
}: {
  items: [FeatureItem, FeatureItem]
  onChange: (next: [FeatureItem, FeatureItem]) => void
}) {
  return (
    <div className="space-y-3">
      {([0, 1] as const).map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded p-2 space-y-2">
          <div className="grid grid-cols-[1fr_90px] gap-2 items-end">
            <Field label={`Card ${i + 1} name`}>
              <Text
                value={items[i].name}
                onChange={(t) => {
                  const next = [...items] as [FeatureItem, FeatureItem]
                  next[i] = { ...next[i], name: t }
                  onChange(next)
                }}
              />
            </Field>
            <Field label="Price">
              <NumberInput
                value={items[i].price}
                onChange={(n) => {
                  const next = [...items] as [FeatureItem, FeatureItem]
                  next[i] = { ...next[i], price: n }
                  onChange(next)
                }}
              />
            </Field>
          </div>
          <Field label="Description">
            <Text
              value={items[i].description}
              onChange={(t) => {
                const next = [...items] as [FeatureItem, FeatureItem]
                next[i] = { ...next[i], description: t }
                onChange(next)
              }}
            />
          </Field>
        </div>
      ))}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      {label ? <span className="block text-[11px] font-medium text-gray-600 mb-1">{label}</span> : null}
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
