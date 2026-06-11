// ─────────────────────────────────────────────────────────────────────────────
// sections/DesignSystem.tsx — Living style guide
//
// Accessible at /design-system in the browser.
// Shows every primitive in every variant/state.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { FONT_DISPLAY, FONT_BODY, MUTED, TEXT, TEAL, GOLD } from '../constants'
import { Card, CardHeader, CardBody, CardFooter }    from '../components/ui/card'
import { SectionBox }                                 from '../components/ui/section-box'
import { MetricCard }                                 from '../components/ui/metric-card'
import { StarRating }                                 from '../components/ui/star-rating'
import { Button }                                     from '../components/ui/button'
import { Label }                                      from '../components/ui/label'
import { Input, Textarea, Select }                    from '../components/ui/input'
import { Skeleton, SkeletonCard }                     from '../components/ui/skeleton'
import { EmptyState }                                 from '../components/ui/empty-state'

// ── Helper components ──────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ marginBottom: 24, paddingBottom: 12, borderBottom: '2px solid var(--t-primary)', display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400, fontFamily: FONT_DISPLAY, color: 'var(--t-primary-dk)' }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT_BODY }}>
        {label}
      </p>
      {children}
    </div>
  )
}

// ── DesignSystem page ──────────────────────────────────────────────────────

export default function DesignSystem() {
  const [rating, setRating]     = useState(3)
  const [inputVal, setInputVal] = useState('')
  const [textaVal, setTextaVal] = useState('')
  const [selVal, setSelVal]     = useState('breakfast')

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', fontFamily: FONT_BODY }}>
      {/* Page header */}
      <div style={{ marginBottom: 48, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 36, fontWeight: 400, fontFamily: FONT_DISPLAY, color: 'var(--t-primary-dk)' }}>
          Design System
        </h1>
        <p style={{ margin: 0, color: MUTED, fontSize: 15 }}>
          Living style guide — every primitive in every variant and state.
        </p>
      </div>

      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <Section title="Card">
        <Group label="variant: flat (default)">
          <Card variant="flat">
            <CardHeader title="Flat card" sub="No shadow, simple border" />
            <CardBody><p style={{ margin: 0, color: MUTED, fontSize: 14 }}>Card body content goes here. Padding is handled by CardBody.</p></CardBody>
            <CardFooter><Button size="sm" variant="ghost">Action</Button></CardFooter>
          </Card>
        </Group>

        <Group label="variant: elevated — hover to see lift">
          <Card variant="elevated">
            <CardHeader title="Elevated card" sub="Subtle shadow, lifts 2px on hover" />
            <CardBody><p style={{ margin: 0, color: MUTED, fontSize: 14 }}>Used for post cards, metric panels, and primary content areas.</p></CardBody>
          </Card>
        </Group>

        <Group label="variant: glass — used over images/gradients">
          <div style={{ background: 'linear-gradient(135deg, var(--t-primary) 0%, var(--t-primary-dk) 100%)', borderRadius: 14, padding: 20 }}>
            <Card variant="glass">
              <CardHeader title="Glass card" sub="Frosted-glass effect for hero panels" />
              <CardBody><p style={{ margin: 0, fontSize: 14, color: TEXT }}>Semi-transparent background with backdrop blur.</p></CardBody>
            </Card>
          </div>
        </Group>
      </Section>

      {/* ── SectionBox ───────────────────────────────────────────────────── */}
      <Section title="SectionBox">
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <SectionBox title="Ship Information" icon="🚢">
            <p style={{ margin: 0, fontSize: 14, color: MUTED }}>Default navy header with LIGHT body.</p>
          </SectionBox>
          <SectionBox title="Weather" icon="🌤️" color={TEAL}>
            <p style={{ margin: 0, fontSize: 14, color: MUTED }}>Custom accent color header.</p>
          </SectionBox>
          <SectionBox title="Budget" icon="💳" color="#8B5CF6">
            <p style={{ margin: 0, fontSize: 14, color: MUTED }}>Plum header variant.</p>
          </SectionBox>
        </div>
      </Section>

      {/* ── MetricCard ───────────────────────────────────────────────────── */}
      <Section title="MetricCard">
        <Group label="Values count up from 0 on mount — reload to replay">
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <MetricCard icon="📅" value={6}     label="Days Logged"   sub="out of 14"    color="var(--t-primary)" ring={43} />
            <MetricCard icon="🗺️"  value={8}     label="Ports Planned" sub="5 with notes"  color={TEAL}  ring={57} />
            <MetricCard icon="💳" value="£420"  label="Total Spent"   sub="of £700 budget" color={GOLD}  pct={60} />
            <MetricCard icon="⭐" value={4}     label="Avg Rating"    sub="across 6 days"  color="#F97316" />
            <MetricCard icon="🧳" value={18}    label="Items Packed"  sub="of 24"         color="#8B5CF6" pct={75} ring={75} />
            <MetricCard icon="💳" value="£820"  label="Overspent!"    sub="of £700 budget" color="#DC2626" pct={117} ring={117} alert />
          </div>
        </Group>
      </Section>

      {/* ── StarRating ───────────────────────────────────────────────────── */}
      <Section title="StarRating">
        <Group label="Interactive — click to set">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <StarRating value={rating} onChange={setRating} />
              <span style={{ fontSize: 14, color: MUTED }}>{rating} / 5</span>
            </div>
          </div>
        </Group>
        <Group label="Read-only display (size variants)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <StarRating value={4.5} readonly size={28} />
            <StarRating value={3}   readonly size={22} />
            <StarRating value={1.5} readonly size={16} />
          </div>
        </Group>
      </Section>

      {/* ── Button ───────────────────────────────────────────────────────── */}
      <Section title="Button">
        <Group label="Variants">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </Group>
        <Group label="Sizes">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </Group>
        <Group label="Disabled">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <Button disabled>Primary disabled</Button>
            <Button variant="secondary" disabled>Secondary disabled</Button>
          </div>
        </Group>
      </Section>

      {/* ── Label ────────────────────────────────────────────────────────── */}
      <Section title="Label">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label>Ship Name</Label>
          <Label>Departure Port</Label>
          <Label htmlFor="demo-input">With htmlFor</Label>
        </div>
      </Section>

      {/* ── Input / Textarea / Select ─────────────────────────────────────── */}
      <Section title="Input · Textarea · Select">
        <div style={{ display: 'grid', gap: 20 }}>
          <Group label="Input — focus to see gold ring">
            <Label htmlFor="demo-input">Cruise line</Label>
            <Input id="demo-input" value={inputVal} onChange={e => setInputVal(e.target.value)} placeholder="e.g. Royal Caribbean" />
          </Group>
          <Group label="Input with error">
            <Label>Ship name</Label>
            <Input value="" onChange={() => {}} error="Ship name is required" />
          </Group>
          <Group label="Textarea">
            <Label>Day notes</Label>
            <Textarea value={textaVal} onChange={e => setTextaVal(e.target.value)} placeholder="What happened today…" rows={3} />
          </Group>
          <Group label="Select">
            <Label>Meal type</Label>
            <Select value={selVal} onChange={e => setSelVal(e.target.value)}>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </Select>
          </Group>
        </div>
      </Section>

      {/* ── Skeleton ─────────────────────────────────────────────────────── */}
      <Section title="Skeleton">
        <Group label="Inline elements">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400 }}>
            <Skeleton height={20} width="60%" />
            <Skeleton height={14} />
            <Skeleton height={14} width="80%" />
            <Skeleton height={14} width="45%" />
          </div>
        </Group>
        <Group label="Card placeholder">
          <div style={{ maxWidth: 400 }}>
            <SkeletonCard />
          </div>
        </Group>
        <Group label="Avatar circle">
          <div style={{ display: 'flex', gap: 12 }}>
            <Skeleton circle size={48} />
            <Skeleton circle size={36} />
            <Skeleton circle size={24} />
          </div>
        </Group>
      </Section>

      {/* ── EmptyState ───────────────────────────────────────────────────── */}
      <Section title="EmptyState">
        <Group label="With icon + heading + body + action">
          <Card variant="flat">
            <EmptyState
              icon="📝"
              heading="No notes yet"
              body="Start capturing your cruise memories, funny moments, and things you want to remember."
              action={{ label: 'Add a note', onClick: () => alert('add note') }}
            />
          </Card>
        </Group>
        <Group label="Minimal — heading only">
          <Card variant="flat">
            <EmptyState icon="🍴" heading="No food entries logged" />
          </Card>
        </Group>
      </Section>
    </div>
  )
}
