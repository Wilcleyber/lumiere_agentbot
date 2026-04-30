import "./globals.css";

export const metadata = {
  title: "Lumière V2",
  description: "Assistente IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body className="antialiased bg-slate-50">
        {children}
      </body>
    </html>
  );
}
