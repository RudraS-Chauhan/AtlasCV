import type {Metadata} from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'AtlasCV - Placement Kit Generator',
  description: 'Generate your ATS Resume, LinkedIn Kit, and HR Emails in 60 seconds.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="bg-[#0a0a0a] text-white font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
