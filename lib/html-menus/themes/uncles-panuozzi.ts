import { z } from 'zod'
import type { HtmlMenuTheme } from '../types'
import { unclesRootCss } from './_shared/brand'
import { wrapDocument } from './_shared/shell'
import { e, fmtPrice } from './_shared/h'
import { unclesLogoSvg } from './_shared/uncles-logo'

const itemSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  prices: z.tuple([z.number(), z.number()]),
})

const featureOptionSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  price: z.number(),
})

const featureSchema = z.object({
  eyebrow: z.string(),
  name: z.string().min(1),
  options: z.array(featureOptionSchema).min(1).max(4),
})

const schema = z.object({
  section: z.object({
    title: z.string().min(1),
    tagline: z.string().optional(),
    columns: z.tuple([z.string(), z.string()]),
    items: z.array(itemSchema).min(1),
  }),
  feature: featureSchema.optional(),
})

export type UnclesPanuozziContent = z.infer<typeof schema>

const themeCss = `
  ${unclesRootCss()}

  main { display: flex; flex-direction: column; }

  .menu { margin-top: 22px; padding: 0 30px; }

  .col-headers {
    display: grid;
    grid-template-columns: 1fr 200px 200px;
    align-items: end;
    padding: 0 14px 10px;
    border-bottom: 1px solid var(--gold-faint);
    margin-bottom: 4px;
  }
  .col-headers .col-size {
    font-family: 'Inter', sans-serif;
    font-weight: 400;
    font-size: 16px;
    letter-spacing: 0.42em;
    text-transform: uppercase;
    color: var(--gold-soft);
    text-align: center;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 200px 200px;
    align-items: center;
    padding: 14px 14px;
    border-bottom: 1px solid var(--gold-faint);
    position: relative;
    min-height: 86px;
  }
  .row:last-of-type { border-bottom: none; }

  .row-marker {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    width: 6px;
    height: 6px;
    background: var(--gold);
    opacity: 0.5;
  }

  .item-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 600;
    font-size: 38px;
    letter-spacing: 0.1em;
    color: var(--gold);
    text-transform: uppercase;
    line-height: 1;
    margin-bottom: 6px;
    padding-left: 24px;
  }
  .item-desc {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-weight: 400;
    font-size: 22px;
    letter-spacing: 0.005em;
    color: var(--cream);
    line-height: 1.35;
    opacity: 0.9;
    padding-left: 24px;
    max-width: 920px;
  }
  .price {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 500;
    font-size: 36px;
    letter-spacing: 0.02em;
    color: var(--gold);
    text-align: center;
    line-height: 1;
  }

  .dolce {
    margin: 16px 30px 0;
    border: 1px solid var(--gold);
    padding: 14px 36px;
    display: grid;
    grid-template-columns: 220px 1fr;
    align-items: center;
    gap: 32px;
    position: relative;
    background: linear-gradient(135deg, rgba(199,160,106,0.06) 0%, rgba(199,160,106,0.02) 60%, transparent 100%);
    box-shadow: inset 0 0 60px rgba(14,25,20,0.3);
  }
  .dolce::before, .dolce::after {
    content: '';
    position: absolute;
    width: 11px;
    height: 11px;
    border: 1px solid var(--gold);
    background: var(--green-base);
    transform: translateY(-50%) rotate(45deg);
    top: 50%;
  }
  .dolce::before { left: -6px; }
  .dolce::after  { right: -6px; }
  .dolce-corner-fill {
    position: absolute;
    width: 5px;
    height: 5px;
    background: var(--gold);
    transform: translateY(-50%) rotate(45deg);
    top: 50%;
    opacity: 0.6;
  }
  .dolce-corner-fill.l { left: -3px; }
  .dolce-corner-fill.r { right: -3px; }
  .dolce-stack {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--gold-faint);
    padding-right: 32px;
    height: 100%;
    justify-content: center;
  }
  .dolce-eyebrow {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: var(--gold-soft);
    margin-bottom: 6px;
    white-space: nowrap;
  }
  .dolce-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 600;
    font-size: 38px;
    letter-spacing: 0.16em;
    color: var(--gold);
    text-transform: uppercase;
    line-height: 1;
  }
  .dolce-options { display: flex; flex-direction: column; gap: 4px; }
  .dolce-row {
    display: grid;
    grid-template-columns: 200px 1fr 140px;
    align-items: center;
    gap: 24px;
    padding: 4px 0;
  }
  .dolce-row + .dolce-row {
    border-top: 1px solid var(--gold-faint);
    padding-top: 8px;
    margin-top: 4px;
  }
  .dolce-flavour {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 600;
    font-size: 26px;
    letter-spacing: 0.14em;
    color: var(--gold);
    text-transform: uppercase;
    line-height: 1;
  }
  .dolce-desc {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-weight: 400;
    font-size: 22px;
    color: var(--cream);
    line-height: 1.35;
    opacity: 0.9;
  }
  .dolce-price {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 500;
    font-size: 32px;
    color: var(--gold);
    text-align: center;
    letter-spacing: 0.02em;
    line-height: 1;
  }
`

function renderBody(content: UnclesPanuozziContent): string {
  const cols = content.section.columns
  const items = content.section.items
    .map(
      (item) => `
        <div class="row">
          <span class="row-marker"></span>
          <div>
            <div class="item-name">${e(item.name)}</div>
            <div class="item-desc">${e(item.description)}</div>
          </div>
          <div class="price">${e(fmtPrice(item.prices[0]))}</div>
          <div class="price">${e(fmtPrice(item.prices[1]))}</div>
        </div>`
    )
    .join('')

  const tagline = content.section.tagline
    ? `<p class="tagline">${e(content.section.tagline)}</p>`
    : ''

  const featureBand = content.feature
    ? `
      <div class="dolce">
        <span class="dolce-corner-fill l"></span>
        <span class="dolce-corner-fill r"></span>
        <div class="dolce-stack">
          <div class="dolce-eyebrow">${e(content.feature.eyebrow)}</div>
          <div class="dolce-name">${e(content.feature.name)}</div>
        </div>
        <div class="dolce-options">
          ${content.feature.options
            .map(
              (opt) => `
            <div class="dolce-row">
              <div class="dolce-flavour">${e(opt.name)}</div>
              <div class="dolce-desc">${e(opt.description)}</div>
              <div class="dolce-price">${e(fmtPrice(opt.price))}</div>
            </div>`
            )
            .join('')}
        </div>
      </div>`
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
      </header>
      <main>
        <div class="section-band">
          <span class="section-line-l"></span>
          <span class="section-band-diamond">◆</span>
          <span class="section-title">${e(content.section.title)}</span>
          <span class="section-band-diamond">◆</span>
          <span class="section-line-r"></span>
        </div>
        ${tagline}
        <div class="menu">
          <div class="col-headers">
            <div></div>
            <div class="col-size">${e(cols[0])}</div>
            <div class="col-size">${e(cols[1])}</div>
          </div>
          ${items}
        </div>
        ${featureBand}
      </main>
    </div>
  `
}

const defaultContent: UnclesPanuozziContent = {
  section: {
    title: 'Signature Panuozzi',
    tagline: 'Freshly baked daily · premium ingredients',
    columns: ['Classico', 'Grande'],
    items: [
      {
        name: 'Roma',
        description: 'Prosciutto crudo, stracciatella, fresh tomato, rocket, balsamic glaze',
        prices: [8.95, 11.45],
      },
      {
        name: 'Milano',
        description: 'Mortadella al pistachio, stracciatella, pistachio cream, crushed pistachios, rocket',
        prices: [8.95, 11.45],
      },
      {
        name: 'Palermo',
        description: 'Spicy salami, fior di latte mozzarella, pesto, sun-dried tomatoes, roasted peppers, hot honey',
        prices: [8.95, 11.45],
      },
      {
        name: 'Rimini',
        description: 'Italian roast turkey, mozzarella, fresh tomato, pesto, caramelised onions, rocket',
        prices: [8.5, 11.5],
      },
      {
        name: 'Venezia',
        description:
          'Grilled Mediterranean vegetables, stracciatella, pesto, caramelised onions, roasted peppers, balsamic glaze',
        prices: [7.95, 9.95],
      },
    ],
  },
  feature: {
    eyebrow: 'Sweet Panuozzo',
    name: 'Dolce',
    options: [
      { name: 'Nutella', description: 'Nutella', price: 5.95 },
      { name: 'Pistachio', description: 'Pistachio cream', price: 5.95 },
    ],
  },
}

export const unclesPanuozziTheme: HtmlMenuTheme<UnclesPanuozziContent> = {
  key: 'uncles-panuozzi',
  displayName: "Uncle's — Signature Panuozzi (1920×1080)",
  schema,
  defaultContent,
  render(content) {
    return wrapDocument({
      title: "Uncle's — Signature Panuozzi",
      css: themeCss,
      body: renderBody(content),
    })
  },
}
