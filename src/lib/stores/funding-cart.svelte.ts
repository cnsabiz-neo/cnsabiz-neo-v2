import type { Database } from '$lib/supabase/types';

type Reward = Database['public']['Tables']['rewards']['Row'];

interface CartItem {
	reward: Reward;
	quantity: number;
}

let item = $state<CartItem | null>(null);

export const fundingCart = {
	get item() { return item; },
	get total() { return item ? item.reward.amount * item.quantity : 0; },

	select(reward: Reward, quantity = 1) {
		item = { reward, quantity };
	},
	setQuantity(quantity: number) {
		if (item) item = { ...item, quantity };
	},
	clear() {
		item = null;
	}
};
