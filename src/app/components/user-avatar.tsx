import React from "react";
import Image from "next/image";

interface UserAvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  className?: string;
  size?: number;
}

export function UserAvatar({
  src,
  firstName,
  lastName,
  className = "",
  size = 32,
}: UserAvatarProps) {
  const initials = React.useMemo(() => {
    if (!firstName && !lastName) return "?";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  }, [firstName, lastName]);

  if (src) {
    return (
      <div className={`relative overflow-hidden rounded-full bg-gray-50 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image src={src}
          alt={`${firstName} ${lastName}`}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center rounded-full bg-gray-100 ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="text-sm font-medium text-gray-600">{initials}</span>
    </div>
  );
}
