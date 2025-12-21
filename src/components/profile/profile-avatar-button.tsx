"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { User } from "lucide-react";
import { ProfileMenu } from "./profile-menu";

export function ProfileAvatarButton() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative" onMouseLeave={() => setIsMenuOpen(false)}>
      <button
        onMouseEnter={() => setIsMenuOpen(true)}
        className="h-9 w-9 rounded-full bg-primary overflow-hidden flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
      >
        {user?.image ? (
          <Image
            src={user.image}
            alt={user?.name || "User"}
            width={36}
            height={36}
            sizes="36px"
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-5 w-5" />
        )}
      </button>

      <ProfileMenu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} />
    </div>
  );
}
