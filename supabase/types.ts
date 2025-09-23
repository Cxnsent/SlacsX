export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projekte: {
        Row: {
          id: string;
          titel: string;
          kanzlei_id: string | null;
          projekt_typ: "Selbstbucher" | "Auftragsbuchhaltung" | null;
          bucket: string;
          status: string;
          prioritaet: string;
          start_datum: string | null;
          faelligkeits_datum: string | null;
          notizen: string | null;
          metadaten: Json;
          checkliste: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["projekte"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["projekte"]["Row"]>;
      };
      workflow_logs: {
        Row: {
          id: string;
          projekt_id: string;
          aktion: string;
          details: Json | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workflow_logs"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["workflow_logs"]["Row"]>;
      };
      vorlagen: {
        Row: {
          id: string;
          name: string;
          betreff: string | null;
          inhalt: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["vorlagen"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["vorlagen"]["Row"]>;
      };
    };
  };
}
