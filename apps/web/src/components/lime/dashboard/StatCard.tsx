import { MaterialIcon } from '@/components/ui/MaterialIcon';

export function StatCard({
  label,
  value,
  hint,
  icon,
  iconClassName = 'text-primary',
  iconWrapClassName = 'bg-primary-container/20',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: string;
  iconClassName?: string;
  iconWrapClassName?: string;
}) {
  return (
    <div className="dashboard-shadow rounded-xl bg-surface-container-lowest p-6 transition-all hover:scale-[1.01] hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-full p-2 ${iconWrapClassName}`}>
          <MaterialIcon name={icon} className={iconClassName} size={20} />
        </div>
        {hint && <span className="text-label-sm font-bold text-primary">{hint}</span>}
      </div>
      <p className="text-label-md uppercase tracking-wider text-secondary">{label}</p>
      <h3 className="mt-1 font-headline text-headline-md font-bold">{value}</h3>
    </div>
  );
}
