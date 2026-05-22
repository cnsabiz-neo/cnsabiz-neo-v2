const krwFormatter = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' });
const numFormatter = new Intl.NumberFormat('ko-KR');

export function formatKRW(amount: number): string {
	return krwFormatter.format(amount);
}

export function formatNumber(n: number): string {
	return numFormatter.format(n);
}

export function formatShortKRW(amount: number): string {
	if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}억원`;
	if (amount >= 10_000) return `${Math.floor(amount / 10_000).toLocaleString('ko-KR')}만원`;
	return formatKRW(amount);
}
