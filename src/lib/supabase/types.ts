export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProjectStatus = 'draft' | 'pending_review' | 'active' | 'funded' | 'failed' | 'cancelled';
export type TxStatus      = 'pending' | 'paid' | 'cancelled' | 'refunded';

export interface Database {
	public: {
		Tables: {
			// ──────────────────────────────────────────
			profiles: {
				Row: {
					id:           string;
					username:     string | null;
					display_name: string | null;
					avatar_url:   string | null;
					bio:          string | null;
					is_creator:   boolean;
					is_admin:     boolean;
					created_at:   string;
					updated_at:   string;
				};
				Insert: {
					id:           string;
					username?:    string | null;
					display_name?: string | null;
					avatar_url?:  string | null;
					bio?:         string | null;
					is_creator?:  boolean;
					is_admin?:    boolean;
				};
				Update: {
					username?:    string | null;
					display_name?: string | null;
					avatar_url?:  string | null;
					bio?:         string | null;
					is_creator?:  boolean;
				};
			};

			// ──────────────────────────────────────────
			categories: {
				Row: {
					id:         number;
					name:       string;
					name_en:    string | null;
					slug:       string;
					icon_url:   string | null;
					sort_order: number;
				};
				Insert: {
					name:        string;
					name_en?:    string | null;
					slug:        string;
					icon_url?:   string | null;
					sort_order?: number;
				};
				Update: {
					name?:       string;
					icon_url?:   string | null;
					sort_order?: number;
				};
			};

			// ──────────────────────────────────────────
			// projects — story_html 제거됨 (→ project_stories)
			projects: {
				Row: {
					id:             string;
					creator_id:     string;
					category_id:    number | null;
					slug:           string;
					title:          string;
					subtitle:       string | null;
					thumbnail_url:  string | null;
					goal_amount:    number;
					current_amount: number;
					backer_count:   number;
					comment_count:  number;   // ← NEW
					update_count:   number;   // ← NEW
					status:         ProjectStatus;
					starts_at:      string | null;
					ends_at:        string | null;
					is_featured:    boolean;
					tags:           string[];
					view_count:     number;
					created_at:     string;
					updated_at:     string;
				};
				Insert: {
					creator_id:     string;
					category_id?:   number | null;
					slug:           string;
					title:          string;
					subtitle?:      string | null;
					thumbnail_url?: string | null;
					goal_amount:    number;
					status?:        ProjectStatus;
					starts_at?:     string | null;
					ends_at?:       string | null;
					tags?:          string[];
				};
				Update: {
					title?:         string;
					subtitle?:      string | null;
					thumbnail_url?: string | null;
					goal_amount?:   number;
					status?:        ProjectStatus;
					starts_at?:     string | null;
					ends_at?:       string | null;
					is_featured?:   boolean;
					tags?:          string[];
				};
			};

			// ──────────────────────────────────────────
			// project_stories — NEW: story_html 전용 (상세 페이지에서만 JOIN)
			project_stories: {
				Row: {
					project_id: string;
					story_html: string | null;
					updated_at: string;
				};
				Insert: {
					project_id: string;
					story_html?: string | null;
				};
				Update: {
					story_html?: string | null;
				};
			};

			// ──────────────────────────────────────────
			// rewards — creator_id 추가됨 (RLS 최적화)
			rewards: {
				Row: {
					id:                 string;
					project_id:         string;
					creator_id:         string;   // ← NEW
					title:              string;
					description:        string | null;
					amount:             number;
					max_quantity:       number | null;
					claimed_count:      number;
					estimated_delivery: string | null;
					is_early_bird:      boolean;
					sort_order:         number;
					created_at:         string;
				};
				Insert: {
					project_id:          string;
					creator_id:          string;  // ← NEW (필수)
					title:               string;
					description?:        string | null;
					amount:              number;
					max_quantity?:       number | null;
					estimated_delivery?: string | null;
					is_early_bird?:      boolean;
					sort_order?:         number;
				};
				Update: {
					title?:              string;
					description?:        string | null;
					amount?:             number;
					max_quantity?:       number | null;
					estimated_delivery?: string | null;
					is_early_bird?:      boolean;
					sort_order?:         number;
				};
			};

			// ──────────────────────────────────────────
			fundings: {
				Row: {
					id:         string;
					project_id: string;
					backer_id:  string;
					reward_id:  string | null;
					amount:     number;
					quantity:   number;
					status:     TxStatus;
					anonymous:  boolean;
					message:    string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					project_id:  string;
					backer_id:   string;
					reward_id?:  string | null;
					amount:      number;
					quantity?:   number;
					status?:     TxStatus;
					anonymous?:  boolean;
					message?:    string | null;
				};
				Update: {
					status?: TxStatus;
				};
			};

			// ──────────────────────────────────────────
			// payments — toss_response → transfer_meta, payment_key 제거
			payments: {
				Row: {
					id:            string;
					funding_id:    string;
					order_id:      string;
					amount:        number;
					method:        string;
					status:        TxStatus;
					transfer_meta: Json | null;   // ← RENAMED (계좌이체 메타)
					approved_at:   string | null;
					created_at:    string;
					updated_at:    string;
				};
				Insert: {
					funding_id:     string;
					order_id:       string;
					amount:         number;
					method?:        string;
					status?:        TxStatus;
					transfer_meta?: Json | null;
				};
				Update: {
					status?:        TxStatus;
					transfer_meta?: Json | null;
					approved_at?:   string | null;
				};
			};

			// ──────────────────────────────────────────
			project_updates: {
				Row: {
					id:           string;
					project_id:   string;
					author_id:    string;
					title:        string;
					content_html: string | null;
					is_public:    boolean;
					created_at:   string;
					updated_at:   string;
				};
				Insert: {
					project_id:    string;
					author_id:     string;
					title:         string;
					content_html?: string | null;
					is_public?:    boolean;
				};
				Update: {
					title?:        string;
					content_html?: string | null;
					is_public?:    boolean;
				};
			};

			// ──────────────────────────────────────────
			comments: {
				Row: {
					id:         string;
					project_id: string;
					author_id:  string;
					parent_id:  string | null;
					content:    string;
					is_deleted: boolean;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					project_id:  string;
					author_id:   string;
					parent_id?:  string | null;
					content:     string;
				};
				Update: {
					content?:    string;
					is_deleted?: boolean;
				};
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: {
			project_status: ProjectStatus;
			tx_status:      TxStatus;
		};
	};
}
