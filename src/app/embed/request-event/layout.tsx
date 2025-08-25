import '@/app/globals.css';
import { Toaster } from '@/components/ui/toaster';
import { JotaiProvider } from '@/lib/state';

export default function EmbedRequestEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Request Event - Pony Club Events</title>
        <meta name="description" content="Request a pony club event date" />
        <meta name="robots" content="noindex, nofollow" />
        {/* Allow embedding in iframes */}
        <meta httpEquiv="Content-Security-Policy" content="frame-ancestors *;" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              <JotaiProvider>
                {children}
              </JotaiProvider>
            </div>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
