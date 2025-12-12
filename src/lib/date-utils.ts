export const computeAge = (created: string | number | Date | null | undefined): string => {
    if (!created || created === '-' || created === 'Unknown' || created === 'Loading...') return 'Unknown';

    let d: Date;

    if (typeof created === 'number') {
        // Assume timestamp in seconds if small, milliseconds if large
        d = new Date(created * 1000);
        if (d.getFullYear() > 3000 || d.getFullYear() < 1970) {
            d = new Date(created); // Try as ms
        }
    } else {
        // Try parsing string
        d = new Date(created);

        // Safari fallback: ISO 8601 usually works, but "YYYY-MM-DD HH:MM:SS" might fail
        // Replace spaces with T if it looks like a date-time string
        if (isNaN(d.getTime()) && typeof created === 'string') {
            // Try replacing space with T for Safari compatibility
            const safariSafe = created.replace(' ', 'T');
            d = new Date(safariSafe);
        }
    }

    if (isNaN(d.getTime())) return 'Unknown';

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Unknown'; // Future date?
    if (diffDays === 0) return 'Less than 1 day';

    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = Math.floor((diffDays % 365) % 30);

    const parts = [] as string[];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);

    return parts.length ? parts.join(" ") : "Less than 1 day";
};
