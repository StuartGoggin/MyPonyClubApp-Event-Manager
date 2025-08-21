export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Pony Club Events Calendar</title>
        <meta name="description" content="View upcoming pony club events across all Victorian zones" />
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
