export type BucketDefinition = {
  id: string;
  title: string;
  description: string;
  accent: string;
};

export const bucketDefinitions: BucketDefinition[] = [
  {
    id: "Pool",
    title: "Pool",
    description: "Neue Mandanten und Uploads",
    accent: "from-cyan-400 via-sky-500 to-blue-500"
  },
  {
    id: "Konzeptblatt gesendet",
    title: "Konzeptblatt gesendet",
    description: "Konzeptblatt an Mandanten versendet",
    accent: "from-blue-500 via-indigo-500 to-purple-500"
  },
  {
    id: "A Erinnerung Konzeptblatt gesendet",
    title: "A Erinnerung Konzeptblatt",
    description: "1. Follow-Up offen",
    accent: "from-emerald-500 via-lime-400 to-yellow-400"
  },
  {
    id: "B Erinnerung Konzeptblatt gesendet",
    title: "B Erinnerung Konzeptblatt",
    description: "2. Follow-Up offen",
    accent: "from-amber-500 via-orange-500 to-red-500"
  },
  {
    id: "Feedback Kanzlei abwarten",
    title: "Feedback Kanzlei",
    description: "Auf Rückmeldung warten",
    accent: "from-slate-500 via-slate-600 to-slate-700"
  },
  {
    id: "Angebot erstellen",
    title: "Angebot erstellen",
    description: "Konzeptblatt liegt vor",
    accent: "from-teal-400 via-cyan-500 to-blue-400"
  },
  {
    id: "Angebot gesendet",
    title: "Angebot gesendet",
    description: "Angebot beim Mandanten",
    accent: "from-fuchsia-500 via-pink-500 to-rose-500"
  },
  {
    id: "A Erinnerung Angebot gesendet",
    title: "A Erinnerung Angebot",
    description: "Erste Angebots-Erinnerung",
    accent: "from-orange-400 via-amber-400 to-yellow-300"
  },
  {
    id: "B Erinnerung Angebot gesendet",
    title: "B Erinnerung Angebot",
    description: "Zweite Angebots-Erinnerung",
    accent: "from-red-400 via-rose-500 to-pink-500"
  },
  {
    id: "Projekt in Vorbereitung",
    title: "Projekt in Vorbereitung",
    description: "Onboarding und Setup",
    accent: "from-sky-400 via-blue-500 to-indigo-500"
  },
  {
    id: "Projekt in Bearbeitung",
    title: "Projekt in Bearbeitung",
    description: "Umsetzung läuft",
    accent: "from-emerald-400 via-teal-500 to-cyan-500"
  },
  {
    id: "Projekt in Nacharbeitung",
    title: "Projekt in Nacharbeitung",
    description: "Abrechnung und Abschluss",
    accent: "from-purple-500 via-violet-500 to-indigo-500"
  },
  {
    id: "Feedback Kanzlei positiv",
    title: "Feedback Kanzlei positiv",
    description: "Bestätigung erhalten",
    accent: "from-green-400 via-emerald-500 to-teal-500"
  }
];
