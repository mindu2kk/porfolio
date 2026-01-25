'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Home
        </Link>

        {/* Support card */}
        <div className="border-double-animated border-border p-8 sm:p-12">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold uppercase">
                Support Me
              </h1>
              <p className="text-lg text-muted-foreground">
                Your support helps me create more content and projects! ☕💖
              </p>
            </div>

            {/* QR Code Image */}
            <div className="flex justify-center">
              <div className="border-dotted-thick border-border p-6 bg-white">
                <Image
                  src="/qr-code.png"
                  alt="Support QR Code"
                  width={300}
                  height={300}
                  className="w-full max-w-[300px] h-auto"
                  priority
                />
              </div>
            </div>

            {/* Payment methods */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center">Payment Methods</h2>
              
              <div className="grid gap-4">
                {/* PayPal */}
                <a
                  href="https://paypal.me/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-pulse-animated border-border p-4 hover-lift hover:bg-muted transition-all duration-300 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold">PayPal</div>
                    <div className="text-sm text-muted-foreground">
                      paypal.me/yourusername
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>

                {/* Bank Transfer */}
                <div className="border-wave-animated border-border p-4">
                  <div className="font-bold mb-2">Bank Transfer</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Bank: Your Bank Name</div>
                    <div>Account: 1234567890</div>
                    <div>Name: Your Name</div>
                  </div>
                </div>

                {/* Momo */}
                <div className="border-zigzag-animated border-border p-4">
                  <div className="font-bold mb-2">Momo</div>
                  <div className="text-sm text-muted-foreground">
                    Phone: 0123456789
                  </div>
                </div>
              </div>
            </div>

            {/* Thank you message */}
            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Thank you for your support! Every contribution helps me continue creating. 🙏
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
