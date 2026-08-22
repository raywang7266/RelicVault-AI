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
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
      };
      artifacts: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string;
          era: string | null;
          origin: string | null;
          image_url: string;
          image_urls: string[];
          status: string;
          contributor_id: string;
          ai_analysis: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category: string;
          era?: string | null;
          origin?: string | null;
          image_url: string;
          image_urls?: string[];
          status?: string;
          contributor_id: string;
          ai_analysis?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          era?: string | null;
          origin?: string | null;
          image_url?: string;
          image_urls?: string[];
          status?: string;
          contributor_id?: string;
          ai_analysis?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
