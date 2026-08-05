import { NotificationActor } from '../types';

interface NotificationAvatarProps {
  actor: NotificationActor | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-10 w-10 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-24 w-24 text-2xl',
};

export function NotificationAvatar({
  actor,
  size = 'md',
}: NotificationAvatarProps) {
  const initials = actor
    ? `${actor.firstname?.[0] ?? ''}${
        actor.lastname?.[0] ?? ''
      }`.toUpperCase()
    : 'E';

  return (
    <div
      className={`
        relative shrink-0
        ${sizeClasses[size]}
      `}
    >
      <div className="h-full w-full overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 font-semibold text-white">
        {actor?.userPfpUrl ? (
          <img
            src={actor.userPfpUrl}
            alt={`${actor.firstname} ${actor.lastname}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            {initials}
          </span>
        )}
      </div>

      {actor?.isActive ? (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
      ) : null}
    </div>
  );
}
