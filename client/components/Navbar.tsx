import Link from "next/link";
import { Button } from "./ui/button";
import { navItems } from "@/lib/Constants";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { syncUserToDatabase } from "@/actions/user.action";

const Navbar = async () => {
    const user = await currentUser()
    if (user) await syncUserToDatabase()
  return (
    <nav className="flex items-center  shadow-md justify-between mx-auto w-full px-14 py-4 bg-white max-sm:px-4">
      <div className="logo">
        Soul<span className="text-green-500">Space</span>
      </div>
      <div className="nav-links ">
        <ul className="flex items-center justify-center gap-4">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="nav-btn">
        <SignedOut>
          <SignInButton>
            <Button variant="outline">Sign In</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
};

export default Navbar;
