import type { Metadata } from 'next';
import { Space_Grotesk, Work_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const body = Work_Sans({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'AfroMatchmaker.com — Meet Friends Across Africa & The Diaspora',
  description: 'AfroMatchmaker.com links Africans and the diaspora through curated matches, community circles, and hosted gatherings worldwide.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body bg-[#F7F4EF] text-[#2B2B2B]">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
