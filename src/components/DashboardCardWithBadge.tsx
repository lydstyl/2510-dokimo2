interface BadgeProps {
  count: number;
  variant: 'red' | 'orange' | 'green';
  label: string;
}

interface DashboardCardWithBadgeProps {
  title: string;
  description: string;
  href: string;
  badge?: BadgeProps;
}

/**
 * Reusable dashboard card component with optional badge indicator
 * Used to show status/count indicators on dashboard cards
 */
export function DashboardCardWithBadge({
  title,
  description,
  href,
  badge,
}: DashboardCardWithBadgeProps) {
  const badgeClasses = badge
    ? badge.variant === 'red'
      ? 'bg-red-100 text-red-800 border-red-200'
      : badge.variant === 'orange'
      ? 'bg-orange-100 text-orange-800 border-orange-200'
      : 'bg-green-100 text-green-800 border-green-200'
    : '';

  return (
    <a
      href={href}
      className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow relative block"
    >
      {badge && badge.count > 0 && (
        <span
          className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-bold rounded-full border ${badgeClasses}`}
        >
          {badge.count} {badge.label}
        </span>
      )}
      <h3 className="text-lg font-semibold mb-2 pr-20">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </a>
  );
}
