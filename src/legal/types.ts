export type LegalDocKey = "aviso-legal" | "privacidad" | "cookies" | "condiciones";
export type LegalSection = { h: string; p: string[] };
export type LegalDoc = { title: string; sections: LegalSection[] };
export type LegalDocs = Record<LegalDocKey, LegalDoc>;
export const LEGAL_DOC_KEYS: LegalDocKey[] = ["aviso-legal", "privacidad", "cookies", "condiciones"];
