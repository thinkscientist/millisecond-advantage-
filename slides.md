---
theme: none
layout: dark
canvasWidth: 1920
aspectRatio: 16/9
transition: fade
title: The Millisecond Advantage
info: Why AI agents need a real-time architecture — the streamhouse in five pillars.
fonts:
  provider: none
defaults:
  layout: dark
scene: PREMISE · 01
---

<div class="title-slide">
  <div class="eyebrow label">streamhouse architecture · 2026</div>
  <h1 class="display hero">
    <Decode tag="div" text="The Millisecond" />
    <Decode tag="div" text="Advantage" :delay="130" />
  </h1>
  <p class="lede muted">Why AI agents need data that is current,<br>not just correct.</p>
  <TitleWire />
</div>

<style>
.title-slide { position: absolute; inset: 0; padding: 0 120px; }
.title-slide .eyebrow { position: absolute; top: 290px; font-size: 22px; }
.title-slide .hero { position: absolute; top: 330px; margin: 0; font-size: var(--hero); line-height: 1.02; letter-spacing: -0.04em; }
.title-slide .lede { position: absolute; top: 640px; margin: 0; font-size: 40px; line-height: 1.35; animation: ss-enter 700ms var(--ease-out) 600ms both; }
</style>

---
scene: PREMISE · 02
clicks: 6
---

<PillarSlide title="An Afternoon at a Brokerage" takeaway="Fifteen minutes to answer a one-number question." :takeaway-at="6">
  <Brokerage />
</PillarSlide>

---
scene: PREMISE · 03
---

<PillarSlide title="The Stalest Input" kicker="A number is only as fresh as the slowest system behind it">
  <Freshness />
</PillarSlide>

---
scene: PREMISE · 04
---

<ThesisSlide />

---
scene: ARCHITECTURE · 01
---

<SentenceSlide />

---
scene: ARCHITECTURE · 02
---

<PillarSlide title="The Architecture" kicker="Sources in, five pillars, consumers out">
  <ArchitectureDiagram />
</PillarSlide>

---
scene: PILLARS · 01
clicks: 4
---

<PillarSlide
  title="Connect"
  kicker="Events become keyed, timestamped records"
  takeaway="Capture every change as it happens, with a key and a time. Stop polling, stop copying."
  :takeaway-at="4"
>
  <ConnectDiagram />
</PillarSlide>

---
scene: PILLARS · 02
clicks: 5
---

<PillarSlide
  title="Stream"
  kicker="An ordered log you can replay to any moment"
  takeaway="The log is the source of truth. Read from now, or from any moment before it."
  :takeaway-at="5"
>
  <StreamDiagram />
</PillarSlide>

---
scene: PILLARS · 03
clicks: 5
---

<PillarSlide
  title="Process"
  kicker="Keep the number current, one record at a time"
  takeaway="Don't recompute the answer on request. Update it every time an input changes."
  :takeaway-at="5"
>
  <ProcessDiagram />
</PillarSlide>

---
scene: PILLARS · 04
clicks: 5
---

<PillarSlide
  title="Govern"
  kicker="Lineage for clients and regulators"
  takeaway="Every number can say where it came from, and who was allowed to read it."
  :takeaway-at="5"
>
  <GovernDiagram />
</PillarSlide>

---
scene: PILLARS · 05
clicks: 4
---

<PillarSlide
  title="Query"
  kicker="Answer where the data lives"
  takeaway="Ask the table that is already current. Don't ship it somewhere else first."
  :takeaway-at="4"
>
  <QueryDiagram />
</PillarSlide>

---
scene: PILLARS · 06
clicks: 4
---

<PillarSlide
  title="Query"
  kicker="Serve the whole table that Process builds"
  takeaway="Process builds the table once. Every reader queries the same live copy."
  :takeaway-at="4"
>
  <TableDiagram />
</PillarSlide>

---
scene: PAYOFF · 01
clicks: 5
---

<PillarSlide
  title="The Payoff"
  kicker="One record, three readers, three timescales"
  takeaway="Write it once. The same record serves the next millisecond and the next audit."
  :takeaway-at="5"
>
  <PayoffDiagram />
</PillarSlide>

---
scene: PAYOFF · 02
clicks: 4
---

<PillarSlide
  title="The World Before"
  kicker="Copies and pipelines everywhere"
  takeaway="Every copy is one more place for the number to be stale, or wrong."
  :takeaway-at="4"
>
  <BeforeDiagram />
</PillarSlide>

---
scene: PAYOFF · 03
clicks: 4
---

<PillarSlide
  title="Works with the Lakehouse"
  takeaway="Lakehouse for what happened. Streamhouse for what happens next."
  :takeaway-at="4"
>
  <LakehouseDiagram />
</PillarSlide>

---
scene: PLATFORM · 01
clicks: 3
---

<PillarSlide
  title="Delivered by Confluent"
  kicker="Each pillar as a managed service"
  takeaway="Five pillars, one platform: run it as a service, not as five projects."
  :takeaway-at="3"
>
  <PlatformMap
    :left="[{ label: 'Connect' }, { label: 'Stream' }, { label: 'Process' }, { label: 'Govern' }, { label: 'Query' }]"
    :right="[
      { label: 'Managed connectors', sub: 'databases, SaaS, files, CDC' },
      { label: 'Apache Kafka', sub: 'durable, ordered, replayable topics' },
      { label: 'Apache Flink', sub: 'stateful stream processing and SQL' },
      { label: 'Stream Governance', sub: 'schema registry, lineage, data quality rules' },
      { label: 'Tableflow', sub: 'topics served as Iceberg and Delta tables' },
    ]"
  />
</PillarSlide>

---
scene: PLATFORM · 02
clicks: 3
---

<PillarSlide
  title="Extended by IBM"
  kicker="What acts on the data"
  takeaway="Current data in. Decisions and actions out."
  :takeaway-at="3"
>
  <PlatformMap
    mode="fan"
    :left="[{ label: 'Streamhouse', sub: 'current, governed data' }]"
    :right="[
      { label: 'watsonx Orchestrate', sub: 'agents that act on live events' },
      { label: 'watsonx.data', sub: 'lakehouse analytics on the same tables' },
      { label: 'webMethods', sub: 'integration and automation into business apps' },
    ]"
  />
</PillarSlide>

---
scene: PLAYBOOK · 01
clicks: 2
---

<div class="playbook">
  <Decode tag="h1" class="display" text="The playbook" />
  <B :at="1" tag="ol" fx="rise" class="steps">
    <li><span class="n mono accent">01</span>Connect the events, not the copies.</li>
    <li><span class="n mono accent">02</span>Keep the answer current where the events land.</li>
    <li><span class="n mono accent">03</span>Let people and agents read the same live table.</li>
  </B>
  <B :at="2" fx="fade" class="close">
    <Decode v-if="$clicks >= 2" tag="div" class="display" text="The advantage is measured in milliseconds." />
  </B>
</div>

<style>
.playbook { position: absolute; left: 120px; right: 120px; top: 52px; }
.playbook h1 { font-size: 76px; line-height: 84px; margin: 0 0 72px; }
.playbook .steps { list-style: none; margin: 0; padding: 0; font-size: 46px; line-height: 1.3; }
.playbook .steps li { display: flex; gap: 40px; padding: 26px 0; border-top: 1px solid var(--rule); }
.playbook .steps li:nth-child(2) { animation-delay: 90ms; }
.playbook .steps .n { font-size: 28px; padding-top: 12px; width: 60px; }
.playbook .close { position: absolute; top: 700px; left: 0; font-size: 64px; line-height: 1.1; white-space: nowrap; letter-spacing: -0.03em; }
</style>
