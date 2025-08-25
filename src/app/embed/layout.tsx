import '@/app/globals.css';
import { Toaster } from '@/components/ui/toaster';
import { JotaiProvider } from '@/lib/state';

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Pony Club Events - Embed</title>
        <meta name="description" content="Embeddable pony club events widgets" />
        <meta name="robots" content="noindex, nofollow" />
        {/* Allow embedding in iframes */}
        <meta httpEquiv="Content-Security-Policy" content="frame-ancestors *;" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <div className="w-full h-full">
          <JotaiProvider>
            {children}
          </JotaiProvider>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
