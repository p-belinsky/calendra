"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PrivateNavLinks } from "@/constants";
import { usePathname } from "next/navigation";
import { SignedIn, UserButton } from "@clerk/nextjs";

export default function PrivateNavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex justify-between items-center fixed z-50 w-full h-28 bg-gray-200 px-4 sm:px-10 shadow-2xl">
      <Link
        href="/events"
        className="flex items-center gap-1 hover:scale-110 transform origin-center duration-300"
      >
        <Image
          src="/assets/logo.svg"
          alt="Calendra Logo"
          width={60}
          height={60}
        />
      </Link>

      <section className="flex flex-1 justify-center items-center text-black">
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          {PrivateNavLinks.map((item) => {
            const isActive =
              pathname === item.route || pathname.startsWith(`${item.route}/`);

            return (
              <Link
                href={item.route}
                key={item.label}
                className={cn(
                  "flex items-center gap-4 rounded-lg justify-start hover:scale-110 duration-300",
                  isActive && "bg-blue-100 rounded-3xl"
                )}
              >
                <Image
                  src={item.imgURL}
                  alt={item.label}
                  width={30}
                  height={30}
                />
                <p className="text-lg font-semibold max-lg:hidden">
                  {item.label}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="hover:scale-110 transform origin-center duration-300">
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
}
