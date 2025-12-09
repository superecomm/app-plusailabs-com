import BipaPageClient from "./BipaPageClient";

export const metadata = {
  title: "BIPA Trust & Compliance | +AI",
  description:
    "How +AI aligns with Illinois BIPA: consent-first collection, strict retention, no data sales, and secure handling of biometric data.",
  openGraph: {
    title: "BIPA Trust & Compliance | +AI",
    description:
      "How +AI aligns with Illinois BIPA: consent-first collection, strict retention, no data sales, and secure handling of biometric data.",
    url: "/bipa",
  },
};

export default function BipaPage() {
  return <BipaPageClient />;
}

