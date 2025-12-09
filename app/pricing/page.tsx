"use client";

import Link from "next/link";

const betaClosed = process.env.NEXT_PUBLIC_BETA_CLOSED === "true";

export default function PricingPage() {
  const plans = [
    {
      name: "Free AI",
      price: "$0",
      subtitle: "Limited access to models",
      items: [
        "Limited access to models",
        "Limited cloud storage",
        "Limited memory and context",
        "Analytics",
      ],
      cta: "Get Free",
      highlight: false,
    },
    {
      name: "+AI",
      price: "$25",
      subtitle: "Expanded access to models",
      items: [
        "Everything in Free",
        "Expanded access to models",
        "Projects, tasks and team access",
        "Expanded memory and context",
        "Analytics",
      ],
      cta: "Get +AI",
      highlight: true,
    },
    {
      name: "Super +AI",
      price: "$100",
      subtitle: "Maximum memory and context",
      items: ["Everything in Plus", "Maximum memory and context", "Analytics"],
      cta: "Get Super +AI",
      highlight: false,
    },
  ];

  const comparison = [
    { feature: "Messages & interactions", free: "Unlimited", plus: "Unlimited", super: "Unlimited" },
    { feature: "Chat history", free: "Unlimited", plus: "Unlimited", super: "Unlimited" },
    { feature: "Access (web, iOS, Android)", free: "✔", plus: "✔", super: "✔" },
    { feature: "Models (GPT, Claude, Gemini, Grok)", free: "Limited", plus: "Expanded", super: "Maximum" },
    { feature: "Memory / context", free: "Limited", plus: "Expanded", super: "Maximum" },
    { feature: "Projects, tasks, teams", free: "—", plus: "✔", super: "✔" },
    { feature: "Analytics", free: "✔", plus: "✔", super: "Premium" },
  ];

  const faq = [
    {
      q: "How does +AI pricing work?",
      a: "Free AI is $0. +AI is $25/mo. Super +AI is $100/mo. Business and Enterprise are custom.",
    },
    { q: "Can I switch plans anytime?", a: "Yes. Upgrades and downgrades take effect immediately after Stripe checkout." },
    { q: "Do you support teams?", a: "Yes. Projects, tasks, and team access are included on +AI and Super +AI." },
    { q: "Is there an API plan?", a: "Yes. API pricing is $0.2–$0.5 per call with volume tiers available." },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Pricing</p>
            <h1 className="text-4xl font-black leading-tight">Choose your +AI plan</h1>
            <p className="text-gray-600">
              Start for free. Upgrade when you need more models, memory, and collaboration.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={betaClosed ? "/beta-waitlist" : "/subscribe"}
              className="rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black"
            >
              Get started
            </Link>
            <Link
              href={betaClosed ? "/beta-waitlist" : "/super-plus-ai/mobile"}
              className="rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 hover:border-gray-900"
            >
              Launch +AI
            </Link>
          </div>
        </header>

        {/* Plan cards */}
        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border px-6 py-6 shadow-sm bg-white ${
                plan.highlight ? "border-gray-900 shadow-md" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{plan.name}</p>
                  <p className="text-sm text-gray-500">{plan.subtitle}</p>
                </div>
                <span className="text-2xl font-bold">{plan.price}/mo</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {plan.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-gray-900" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={betaClosed ? "/beta-waitlist" : "/subscribe"}
                className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-gray-900 text-white hover:bg-black"
                    : "border border-gray-300 text-gray-900 hover:border-gray-900"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </section>

        {/* Business / API */}
        <section className="mt-12 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">Business</p>
                <p className="text-sm text-gray-500">Collaboration for teams</p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700">
                Contact us
              </span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-gray-900" />
                SAML/SSO, SCIM, and consolidated billing
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-gray-900" />
                Dedicated onboarding, support, and audit logging
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-gray-900" />
                Project-level controls, data residency, SOC 2
              </li>
            </ul>
            <Link
              href={betaClosed ? "/beta-waitlist" : "/subscribe"}
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:border-gray-900"
            >
              Contact sales
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-900 bg-black px-6 py-6 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">Enterprise / API</p>
                <p className="text-sm text-gray-300">Scale, security, and custom terms</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                Custom
              </span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-200">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-white" />
                Advanced security reviews, SLAs, and dedicated support
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-white" />
                Private model routing, connectors, and data controls
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-white" />
                API pricing $0.2–$0.5 per call with volume tiers
              </li>
            </ul>
            <Link
              href="/subscribe"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100"
            >
              Talk to us
            </Link>
          </div>
        </section>

        {/* Comparison */}
        <section className="mt-12 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Compare</p>
              <h2 className="text-2xl font-bold text-gray-900">Feature comparison</h2>
            </div>
            <Link
              href={betaClosed ? "/beta-waitlist" : "/subscribe"}
              className="text-sm font-semibold text-gray-700 hover:text-gray-900"
            >
              Start now →
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-800">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 pr-4">Feature</th>
                  <th className="py-3 pr-4">Free AI</th>
                  <th className="py-3 pr-4">+AI</th>
                  <th className="py-3 pr-4">Super +AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparison.map((row) => (
                  <tr key={row.feature}>
                    <td className="py-3 pr-4 font-semibold">{row.feature}</td>
                    <td className="py-3 pr-4">{row.free}</td>
                    <td className="py-3 pr-4">{row.plus}</td>
                    <td className="py-3 pr-4">{row.super}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-gray-500">FAQ</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900">Common questions</h3>
          <div className="mt-4 divide-y divide-gray-100">
            {faq.map((item) => (
              <div key={item.q} className="py-4">
                <p className="text-sm font-semibold text-gray-900">{item.q}</p>
                <p className="mt-1 text-sm text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

