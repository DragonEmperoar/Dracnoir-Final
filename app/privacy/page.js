import AppShell from '../AppShell'

export const metadata = {
  title: 'Privacy Policy — Dracnoir',
  description: 'How Dracnoir collects, uses, and protects your personal data.',
}

export default function PrivacyPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-10 py-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-violet-500/80">Legal</p>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: June 2025</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/80">

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. Information We Collect</h2>
            <p>We collect information you provide when you create an account, place an order, or interact with the community. This includes your name, email address, shipping address, and payment information (processed securely via Razorpay — we never store card details).</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>Your information is used solely to process orders, communicate order updates, and improve your shopping experience on Dracnoir. We do not sell or share your personal data with third parties for marketing purposes.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. Cookies</h2>
            <p>We use essential cookies to maintain your session and authentication state. No third-party tracking cookies are used.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal data. However, no method of transmission over the internet is 100% secure.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. Contact</h2>
            <p>For privacy-related concerns, contact us at <a href="mailto:support@dracnoir.com" className="text-violet-500 hover:underline">support@dracnoir.com</a>.</p>
          </section>

        </div>
      </div>
    </AppShell>
  )
}
