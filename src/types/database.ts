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
      kanzleien: {
        Row: {
          id: string;
          name: string;
          ansprechpartner: string | null;
          allgemeine_infos: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          ansprechpartner?: string | null;
          allgemeine_infos?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          ansprechpartner?: string | null;
          allgemeine_infos?: string | null;
          created_at?: string;
        };
      };
      sachbearbeiter: {
        Row: {
          id: string;
          kanzlei_id: string;
          name: string;
          email: string | null;
          telefon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          kanzlei_id: string;
          name: string;
          email?: string | null;
          telefon?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          kanzlei_id?: string;
          name?: string;
          email?: string | null;
          telefon?: string | null;
          created_at?: string;
        };
      };
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
        Insert: {
          id?: string;
          titel: string;
          kanzlei_id?: string | null;
          projekt_typ?: "Selbstbucher" | "Auftragsbuchhaltung" | null;
          bucket: string;
          status?: string;
          prioritaet?: string;
          start_datum?: string | null;
          faelligkeits_datum?: string | null;
          notizen?: string | null;
          metadaten?: Json;
          checkliste?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          titel?: string;
          kanzlei_id?: string | null;
          projekt_typ?: "Selbstbucher" | "Auftragsbuchhaltung" | null;
          bucket?: string;
          status?: string;
          prioritaet?: string;
          start_datum?: string | null;
          faelligkeits_datum?: string | null;
          notizen?: string | null;
          metadaten?: Json;
          checkliste?: Json;
          created_at?: string;
        };
      };
      dokumente: {
        Row: {
          id: string;
          projekt_id: string | null;
          file_name: string;
          storage_path: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          projekt_id?: string | null;
          file_name: string;
          storage_path: string;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          projekt_id?: string | null;
          file_name?: string;
          storage_path?: string;
          uploaded_at?: string;
        };
      };
      vorlagen: {
        Row: {
          id: string;
          name: string;
          betreff: string | null;
          inhalt: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          betreff?: string | null;
          inhalt?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          betreff?: string | null;
          inhalt?: string | null;
        };
      };
      kommentare: {
        Row: {
          id: string;
          projekt_id: string;
          author_id: string | null;
          nachricht: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          projekt_id: string;
          author_id?: string | null;
          nachricht: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          projekt_id?: string;
          author_id?: string | null;
          nachricht?: string;
          created_at?: string;
        };
      };
      workflow_logs: {
        Row: {
          id: string;
          projekt_id: string;
          aktion: string;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          projekt_id: string;
          aktion: string;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          projekt_id?: string;
          aktion?: string;
          details?: Json | null;
          created_at?: string;
        };
      };
    };
    Views: {
      dashboard_summary: {
        Row: {
          kanzlei_id: string | null;
          kanzlei_name: string | null;
          projektanzahl: number | null;
          durchschnittliche_dauer: string | null;
        };
      };
    };
    Functions: {};
    Enums: {
      projekt_typ_enum: "Selbstbucher" | "Auftragsbuchhaltung";
    };
  };
}
