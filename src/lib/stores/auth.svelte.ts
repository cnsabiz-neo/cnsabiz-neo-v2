import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { getContext, setContext } from 'svelte';
import type { Database } from '$lib/supabase/types';

interface AuthInitial {
	readonly session: Session | null;
	readonly user: User | null;
	readonly supabase: SupabaseClient<Database>;
}

class AuthState {
	session = $state<Session | null>(null);
	user = $state<User | null>(null);
	supabase = $state<SupabaseClient<Database> | null>(null);

	constructor(initial: AuthInitial) {
		this.session = initial.session;
		this.user = initial.user;
		this.supabase = initial.supabase;
	}

	get isLoggedIn() {
		return !!this.user;
	}

	setSession(session: Session | null, user: User | null) {
		this.session = session;
		this.user = user;
	}
}

const AUTH_KEY = Symbol('auth');

export function setAuthContext(initial: AuthInitial) {
	const auth = new AuthState(initial);
	setContext(AUTH_KEY, auth);
	return auth;
}

export function getAuthContext(): AuthState {
	return getContext(AUTH_KEY);
}
