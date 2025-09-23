import "./globals.css";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { Providers } from "@/components/layout/providers";

export const metadata = {
  title: "SlacsX CRM",
  description: "Kanzlei Kollaboration und Projektmanagement"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body className="bg-background text-slate-100">
        <Providers>
          <div className="min-h-screen bg-background">
            <main className="mx-auto max-w-[1600px] px-6 py-8">{children}</main>
          </div>
        </Providers>
        <Toaster richColors theme="dark" />
      </body>
    </html>
  );
}
