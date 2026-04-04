interface Props {
  show: boolean;
  children: React.ReactNode;
}

export function NotificationBadge({ show, children }: Props) {
  return (
    <div className="relative inline-block">
      {children}
      {show && (
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      )}
    </div>
  );
}
