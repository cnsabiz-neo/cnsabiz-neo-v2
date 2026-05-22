import { createClient } from '@supabase/supabase-js';
import {
	PUBLIC_MARKET_SUPABASE_URL,
	PUBLIC_MARKET_SUPABASE_ANON_KEY
} from '$env/dynamic/public';

/** 브라우저용 — 읽기 전용 공개 데이터 */
export const marketSupabase = createClient(
	PUBLIC_MARKET_SUPABASE_URL,
	PUBLIC_MARKET_SUPABASE_ANON_KEY
);

export type MarketItem = {
	id: string;
	class_num: number;        // 반 (1-12, 99=선생님)
	group_num: number;        // 조
	title: string;
	description: string | null;
	image_url: string | null;
	status: boolean;          // true = 거래완료
	reserved_by: string | null;
	created_at: string;
	is_reserved: boolean;
	price: number;
	domain: number;           // 1=책/학습 2=의류 3=취미/굿즈 4=선생님 애장품
	user_id: string | null;
	user_email: string | null;
	is_completed: boolean;
	uploaded_by: string | null;
	uploader_student_id: string | null;
	teacher_name: string | null;
};

export const DOMAIN_LABELS: Record<number, { label: string; emoji: string; desc: string }> = {
	1: { label: '1영역', emoji: '📚', desc: '책·학습' },
	2: { label: '2영역', emoji: '👕', desc: '의류·액세서리' },
	3: { label: '3영역', emoji: '🎮', desc: '취미·굿즈' },
	4: { label: '4영역', emoji: '🎁', desc: '선생님 애장품' },
};
