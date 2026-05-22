const koDateFormatter = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
const koMonthDayFormatter = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' });

export function formatKoDate(date: string | Date): string {
	return koDateFormatter.format(new Date(date));
}

export function formatKoMonthDay(date: string | Date): string {
	return koMonthDayFormatter.format(new Date(date));
}

export function getDaysLeft(endsAt: string | Date): number {
	const diff = new Date(endsAt).getTime() - Date.now();
	return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getCountdownLabel(endsAt: string | Date): string {
	const diff = new Date(endsAt).getTime() - Date.now();
	if (diff <= 0) return '마감';
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	if (days >= 1) return `D-${days}`;
	const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((diff % (1000 * 60)) / 1000);
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getFundingRate(current: number, goal: number): number {
	if (goal <= 0) return 0;
	return Math.round((current / goal) * 100);
}
