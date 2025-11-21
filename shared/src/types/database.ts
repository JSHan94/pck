// Supabase Database schema (mirrors backend/migrations)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PrizeLayoutCell = {
  cellId: number;
  tier: number;
  salt: string;
};

export type PrizeLayout = PrizeLayoutCell[];

export type Database = {
  public: {
    Tables: {
      Board: {
        Row: {
          boardId: string;
          prizeLayout: PrizeLayout;
          merkleRoot: string;
          isAssigned: boolean;
          createdAt: string;
        };
        Insert: {
          boardId?: string;
          prizeLayout: PrizeLayout;
          merkleRoot: string;
          isAssigned?: boolean;
          createdAt?: string;
        };
        Update: {
          boardId?: string;
          prizeLayout?: PrizeLayout;
          merkleRoot?: string;
          isAssigned?: boolean;
          createdAt?: string;
        };
        Relationships: [];
      };
      User: {
        Row: {
          address: string;
          createdAt: string;
        };
        Insert: {
          address: string;
          createdAt?: string;
        };
        Update: {
          address?: string;
          createdAt?: string;
        };
        Relationships: [];
      };
      GameSession: {
        Row: {
          sessionId: number;
          userAddress: string;
          boardId: string;
          pullCount: number;
          isActive: boolean;
          createdAt: string;
        };
        Insert: {
          sessionId?: number;
          userAddress: string;
          boardId: string;
          pullCount?: number;
          isActive?: boolean;
          createdAt?: string;
        };
        Update: {
          sessionId?: number;
          userAddress?: string;
          boardId?: string;
          pullCount?: number;
          isActive?: boolean;
          createdAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'GameSession_userAddress_fkey';
            columns: ['userAddress'];
            referencedRelation: 'User';
            referencedColumns: ['address'];
          },
          {
            foreignKeyName: 'GameSession_boardId_fkey';
            columns: ['boardId'];
            referencedRelation: 'Board';
            referencedColumns: ['boardId'];
          },
        ];
      };
      RevealedCell: {
        Row: {
          id: number;
          sessionId: number;
          cellId: number;
          tier: number;
          revealedAt: string;
        };
        Insert: {
          id?: number;
          sessionId: number;
          cellId: number;
          tier: number;
          revealedAt?: string;
        };
        Update: {
          id?: number;
          sessionId?: number;
          cellId?: number;
          tier?: number;
          revealedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'RevealedCell_sessionId_fkey';
            columns: ['sessionId'];
            referencedRelation: 'GameSession';
            referencedColumns: ['sessionId'];
          },
        ];
      };
      PrizeClaim: {
        Row: {
          prizeId: string;
          userAddress: string;
          sessionId: number;
          cellId: number;
          tier: number;
          isClaimed: boolean;
          claimedTxHash: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          prizeId?: string;
          userAddress: string;
          sessionId: number;
          cellId: number;
          tier: number;
          isClaimed?: boolean;
          claimedTxHash?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          prizeId?: string;
          userAddress?: string;
          sessionId?: number;
          cellId?: number;
          tier?: number;
          isClaimed?: boolean;
          claimedTxHash?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'PrizeClaim_userAddress_fkey';
            columns: ['userAddress'];
            referencedRelation: 'User';
            referencedColumns: ['address'];
          },
          {
            foreignKeyName: 'PrizeClaim_sessionId_fkey';
            columns: ['sessionId'];
            referencedRelation: 'GameSession';
            referencedColumns: ['sessionId'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Cell = PrizeLayoutCell;
export type Board = Database['public']['Tables']['Board']['Row'];
export type GameSession = Database['public']['Tables']['GameSession']['Row'];
export type RevealedCell = Database['public']['Tables']['RevealedCell']['Row'];
export type PrizeClaim = Database['public']['Tables']['PrizeClaim']['Row'];
