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
					is_admin?:    boolean;
				};
				Relationships: [];
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
				Relationships: [];
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
					comment_count:  number;
					update_count:   number;
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
				Relationships: [
					{
						foreignKeyName: 'projects_creator_id_fkey';
						columns: ['creator_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'projects_category_id_fkey';
						columns: ['category_id'];
						isOneToOne: false;
						referencedRelation: 'categories';
						referencedColumns: ['id'];
					}
				];
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
				Relationships: [
					{
						foreignKeyName: 'project_stories_project_id_fkey';
						columns: ['project_id'];
						isOneToOne: true;
						referencedRelation: 'projects';
						referencedColumns: ['id'];
					}
				];
			};

			// ──────────────────────────────────────────
			// rewards — 권한은 projects 소유권 기반 RLS로 처리 (creator_id 컬럼 없음)
			rewards: {
				Row: {
					id:                 string;
					project_id:         string;
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
				Relationships: [
					{
						foreignKeyName: 'rewards_project_id_fkey';
						columns: ['project_id'];
						isOneToOne: false;
						referencedRelation: 'projects';
						referencedColumns: ['id'];
					}
				];
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
				Relationships: [
					{
						foreignKeyName: 'fundings_project_id_fkey';
						columns: ['project_id'];
						isOneToOne: false;
						referencedRelation: 'projects';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'fundings_backer_id_fkey';
						columns: ['backer_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'fundings_reward_id_fkey';
						columns: ['reward_id'];
						isOneToOne: false;
						referencedRelation: 'rewards';
						referencedColumns: ['id'];
					}
				];
			};

			// ──────────────────────────────────────────
			// payments — 계좌이체 메타는 transfer_meta(JSON)에 저장
			payments: {
				Row: {
					id:            string;
					funding_id:    string;
					order_id:      string;
					amount:        number;
					method:        string;
					status:        TxStatus;
					transfer_meta: Json | null;
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
				Relationships: [
					{
						foreignKeyName: 'payments_funding_id_fkey';
						columns: ['funding_id'];
						isOneToOne: false;
						referencedRelation: 'fundings';
						referencedColumns: ['id'];
					}
				];
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
				Relationships: [
					{
						foreignKeyName: 'project_updates_project_id_fkey';
						columns: ['project_id'];
						isOneToOne: false;
						referencedRelation: 'projects';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'project_updates_author_id_fkey';
						columns: ['author_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
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
				Relationships: [
					{
						foreignKeyName: 'comments_project_id_fkey';
						columns: ['project_id'];
						isOneToOne: false;
						referencedRelation: 'projects';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'comments_author_id_fkey';
						columns: ['author_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'comments_parent_id_fkey';
						columns: ['parent_id'];
						isOneToOne: false;
						referencedRelation: 'comments';
						referencedColumns: ['id'];
					}
				];
			};

			// ──────────────────────────────────────────
			// project_likes — 찜(위시리스트). (project_id, user_id) 복합 PK
			project_likes: {
				Row: {
					project_id: string;
					user_id:    string;
					created_at: string;
				};
				Insert: {
					project_id: string;
					user_id:    string;
				};
				Update: {
					project_id?: string;
					user_id?:    string;
				};
				Relationships: [
					{
						foreignKeyName: 'project_likes_project_id_fkey';
						columns: ['project_id'];
						isOneToOne: false;
						referencedRelation: 'projects';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: {
			project_status: ProjectStatus;
			tx_status:      TxStatus;
		};
		CompositeTypes: Record<string, never>;
	};
}
