interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
} as const;

export default function Avatar({
  src,
  name,
  size = 'md',
  online = false,
  className = '',
}: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className={`relative shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={`${name} avatar`}
          loading="lazy"
          className={`${sizeClasses[size]} rounded-full border border-white/80 object-cover shadow-sm`}
        />
      ) : (
        <div
          aria-label={`${name} avatar`}
          className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 font-semibold text-white shadow-sm`}
        >
          {initials || 'E'}
        </div>
      )}

      {online ? (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
      ) : null}
    </div>
  );
}
