import { z } from 'zod'
import type { HtmlMenuTheme } from '../types'
import { unclesRootCss } from './_shared/brand'
import { wrapDocument } from './_shared/shell'
import { e, fmtPrice } from './_shared/h'
import { unclesLogoSvg } from './_shared/uncles-logo'

const listItem = z.object({ name: z.string().min(1), price: z.number() })
const featureItem = z.object({ name: z.string().min(1), description: z.string(), price: z.number() })

const listQuadrant = z.object({
  kind: z.literal('list'),
  title: z.string().min(1),
  items: z.array(listItem).min(1),
})
const gridQuadrant = z.object({
  kind: z.literal('grid'),
  title: z.string().min(1),
  tagline: z.string().optional(),
  items: z.array(listItem).min(1),
  spanLastFull: z.boolean().optional(),
})
const featurePairQuadrant = z.object({
  kind: z.literal('feature-pair'),
  title: z.string().min(1),
  items: z.tuple([featureItem, featureItem]),
})
const quadrant = z.union([listQuadrant, gridQuadrant, featurePairQuadrant])

const schema = z.object({
  header: z.object({ trail: z.string() }),
  quadrants: z.tuple([quadrant, quadrant, quadrant, quadrant]),
})

export type UnclesQuadrantContent = z.infer<typeof schema>
type Quadrant = z.infer<typeof quadrant>

const themeCss = `
  ${unclesRootCss()}

  .stage { padding: 50px 130px 60px; gap: 26px; }
  .header { margin-bottom: 0; }
  .menu-trail {
    margin-top: 4px;
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 19px;
    letter-spacing: 0.04em;
    color: var(--cream-soft);
    opacity: 0.78;
    text-align: center;
  }

  .section-band {
    margin: 0 0 14px;
    padding: 0 20px;
    gap: 22px;
  }
  .section-line-l, .section-line-r { max-width: 200px; }
  .section-title { font-size: 32px; }
  .section-band-diamond { font-size: 12px; }

  main {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 36px 60px;
    padding: 0 20px;
    min-height: 0;
  }
  .quadrant { display: flex; flex-direction: column; min-height: 0; }

  main::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 60px;
    bottom: 60px;
    width: 1px;
    background: linear-gradient(180deg, transparent 0%, var(--gold-faint) 12%, var(--gold-faint) 88%, transparent 100%);
    transform: translateX(-50%);
    pointer-events: none;
  }
  main::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 60px;
    right: 60px;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, var(--gold-faint) 12%, var(--gold-faint) 88%, transparent 100%);
    transform: translateY(-50%);
    pointer-events: none;
  }

  .quadrant-tagline {
    text-align: center;
    margin: -6px 0 16px;
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 18px;
    letter-spacing: 0.04em;
    color: var(--cream-soft);
    opacity: 0.8;
  }

  .list { flex: 1; display: flex; flex-direction: column; padding: 0 28px; }
  .list-row {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    padding: 14px 12px;
    gap: 16px;
    border-bottom: 1px solid var(--gold-faint);
    flex: 1;
    min-height: 0;
    position: relative;
  }
  .list-row:last-child { border-bottom: none; }
  .list-row::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    width: 5px;
    height: 5px;
    background: var(--gold);
    opacity: 0.5;
  }
  .list-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 500;
    font-size: 26px;
    letter-spacing: 0.04em;
    color: var(--cream);
    padding-left: 18px;
    line-height: 1.2;
  }
  .list-price {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 500;
    font-size: 30px;
    color: var(--gold);
    letter-spacing: 0.02em;
    line-height: 1;
    white-space: nowrap;
  }

  .extras-grid {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 30px;
    padding: 0 20px;
    align-content: stretch;
  }
  .extras-row {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    padding: 9px 10px;
    gap: 10px;
    border-bottom: 1px solid var(--gold-faint);
    position: relative;
    min-height: 0;
  }
  .extras-row.span-full { grid-column: 1 / -1; padding: 9px 10px; }
  .extras-row::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    width: 4px;
    height: 4px;
    background: var(--gold);
    opacity: 0.5;
  }
  .extras-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 500;
    font-size: 22px;
    color: var(--cream);
    padding-left: 14px;
    letter-spacing: 0.02em;
  }
  .extras-price {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 500;
    font-size: 24px;
    color: var(--gold);
    letter-spacing: 0.02em;
    line-height: 1;
    white-space: nowrap;
  }

  .desserts-pair { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 22px; padding: 0 30px; }
  .dessert-card {
    border: 1px solid var(--gold);
    padding: 24px 32px;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 32px;
    position: relative;
    background: linear-gradient(135deg, rgba(199,160,106,0.06) 0%, rgba(199,160,106,0.02) 60%, transparent 100%);
    box-shadow: inset 0 0 60px rgba(14,25,20,0.3);
  }
  .dessert-card::before, .dessert-card::after {
    content: '';
    position: absolute;
    width: 11px;
    height: 11px;
    border: 1px solid var(--gold);
    background: var(--green-base);
    transform: translateY(-50%) rotate(45deg);
    top: 50%;
  }
  .dessert-card::before { left: -6px; }
  .dessert-card::after  { right: -6px; }
  .dessert-stack { display: flex; flex-direction: column; gap: 6px; }
  .dessert-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 600;
    font-size: 36px;
    letter-spacing: 0.16em;
    color: var(--gold);
    text-transform: uppercase;
    line-height: 1;
  }
  .dessert-desc {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-weight: 400;
    font-size: 19px;
    color: var(--cream);
    line-height: 1.3;
  }
  .dessert-price {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 500;
    font-size: 36px;
    color: var(--gold);
    letter-spacing: 0.02em;
    line-height: 1;
    white-space: nowrap;
  }
`

function sectionBand(title: string): string {
  return `
    <div class="section-band">
      <span class="section-line-l"></span>
      <span class="section-band-diamond">◆</span>
      <span class="section-title">${e(title)}</span>
      <span class="section-band-diamond">◆</span>
      <span class="section-line-r"></span>
    </div>`
}

function renderQuadrant(q: Quadrant): string {
  const head = sectionBand(q.title)
  if (q.kind === 'list') {
    return `
      <section class="quadrant">
        ${head}
        <div class="list">
          ${q.items
            .map(
              (item) => `
            <div class="list-row">
              <span class="list-name">${e(item.name)}</span>
              <span class="list-price">${e(fmtPrice(item.price))}</span>
            </div>`
            )
            .join('')}
        </div>
      </section>`
  }
  if (q.kind === 'grid') {
    const tagline = q.tagline ? `<p class="quadrant-tagline">${e(q.tagline)}</p>` : ''
    return `
      <section class="quadrant">
        ${head}
        ${tagline}
        <div class="extras-grid">
          ${q.items
            .map((item, i) => {
              const isLast = i === q.items.length - 1
              const cls = q.spanLastFull && isLast ? 'extras-row span-full' : 'extras-row'
              return `
            <div class="${cls}">
              <span class="extras-name">${e(item.name)}</span>
              <span class="extras-price">${e(fmtPrice(item.price))}</span>
            </div>`
            })
            .join('')}
        </div>
      </section>`
  }
  // feature-pair
  return `
    <section class="quadrant">
      ${head}
      <div class="desserts-pair">
        ${q.items
          .map(
            (item) => `
          <div class="dessert-card">
            <div class="dessert-stack">
              <div class="dessert-name">${e(item.name)}</div>
              <div class="dessert-desc">${e(item.description)}</div>
            </div>
            <div class="dessert-price">${e(fmtPrice(item.price))}</div>
          </div>`
          )
          .join('')}
      </div>
    </section>`
}

function renderBody(content: UnclesQuadrantContent): string {
  const trail = content.header.trail
    ? `<p class="menu-trail">${e(content.header.trail)}</p>`
    : ''
  return `
    <div class="frame-outer"></div>
    <div class="frame-inner"></div>
    <span class="corner tl"></span>
    <span class="corner tr"></span>
    <span class="corner bl"></span>
    <span class="corner br"></span>
    <div class="stage">
      <header class="header">
        <div class="brand-logo">${unclesLogoSvg}</div>
        ${trail}
      </header>
      <main>
        ${content.quadrants.map(renderQuadrant).join('')}
      </main>
    </div>
  `
}

const defaultContent: UnclesQuadrantContent = {
  header: { trail: 'Coffee · Drinks · Extras · Desserts' },
  quadrants: [
    {
      kind: 'list',
      title: 'Italian Coffee',
      items: [
        { name: 'Espresso', price: 2.2 },
        { name: 'Americano', price: 2.8 },
        { name: 'Cappuccino', price: 3.3 },
        { name: 'Latte', price: 3.3 },
        { name: 'Flat White', price: 3.3 },
      ],
    },
    {
      kind: 'grid',
      title: 'Extras',
      tagline: 'Add to any panuozzo',
      spanLastFull: true,
      items: [
        { name: 'Mozzarella', price: 1.5 },
        { name: 'Turkey', price: 2.0 },
        { name: 'Stracciatella', price: 2.0 },
        { name: 'Pistachio Cream', price: 1.5 },
        { name: 'Prosciutto', price: 2.5 },
        { name: 'Pesto', price: 1.0 },
        { name: 'Salami', price: 2.0 },
        { name: 'Hot Honey', price: 1.0 },
        { name: 'Mortadella', price: 2.0 },
      ],
    },
    {
      kind: 'list',
      title: 'Water & Drinks',
      items: [
        { name: 'Still Water · Coca-Cola · Fanta · Sprite', price: 1.0 },
        { name: 'Sparkling Water', price: 1.5 },
        { name: 'San Pellegrino Limonata · Aranciata Rossa · Chinotto', price: 2.2 },
      ],
    },
    {
      kind: 'feature-pair',
      title: 'Desserts',
      items: [
        { name: 'Tiramisu', description: 'Mascarpone, coffee, cacao', price: 5.0 },
        { name: 'Cannoli', description: 'Ricotta, pistachio or chocolate', price: 2.0 },
      ],
    },
  ],
}

export const unclesQuadrantTheme: HtmlMenuTheme<UnclesQuadrantContent> = {
  key: 'uncles-quadrant',
  displayName: "Uncle's — Coffee · Drinks · Extras · Desserts (1920×1080)",
  schema,
  defaultContent,
  render(content) {
    return wrapDocument({
      title: "Uncle's — Coffee, Drinks, Extras & Desserts",
      css: themeCss,
      body: renderBody(content),
    })
  },
}
