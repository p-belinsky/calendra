import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";

export default function PublicNavBar() {
  return (
    <nav className="flex items-center justify-between fixed z-50 w-full h-28 bg-gray-300 px-4 sm:px-10 shadow-2xl">
      <Link
        href="/login"
        className="flex items-center gap-1 hover:scale-110 transform origin-center duration-300"
      >
        <Image
          src="/assets/logo.svg"
          alt="Calendra Logo"
          width={60}
          height={60}
        />
      </Link>

      <section className="flex justify-end items-center gap-4 sm:gap-6">
        <SignInButton>
          <Button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold px-4 py-2 border border-blue-700 rounded-2xl shadow-2xl transform hover:scale-105 duration-300"
            type="button"
          >
            Login
          </Button>
        </SignInButton>

        <SignUpButton>
          <Button
            className="bg-white hover:bg-gray-100 text-gray-800 font-semibold px-4 py-2 border border-gray-400 rounded-2xl shadow-2xl transform hover:scale-105 duration-300"
            variant="outline"
          >
            Register
          </Button>
        </SignUpButton>
      </section>
    </nav>
  );
}
