import Link from 'next/link';
import { Home } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary flex items-center">
          <Home className="mr-2 h-7 w-7 text-accent" />
          ChattyRental
        </Link>
        <nav>
          {/* Navigation links can be added here if needed */}
        </nav>
      </div>
    </header>
  );
}
