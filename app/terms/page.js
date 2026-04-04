import AppShell from '../AppShell'

export const metadata = {
  title: 'Terms & Conditions — Dracnoir',
  description: 'Read the Terms and Conditions for using Dracnoir, the anime merchandise store.',
}

export default function TermsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-10 py-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-violet-500/80">Legal</p>
          <h1 className="text-3xl font-bold tracking-tight">Terms &amp; Conditions</h1>
          <p className="text-sm text-muted-foreground">Last updated: June 2025</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/80">

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Dracnoir website and placing orders, you agree to be bound by
              these Terms &amp; Conditions. If you do not agree, please do not use our services.
              Dracnoir reserves the right to update these terms at any time without prior notice.
              Continued use of the platform constitutes acceptance of any revised terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. Products &amp; Pricing</h2>
            <p>
              All products listed on Dracnoir are subject to availability. Prices are displayed in
              Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise.
              We reserve the right to change prices at any time. Orders are charged at the price
              shown at the time of purchase.
            </p>
            <p>
              Product images are for illustrative purposes. Actual colours and dimensions may vary
              slightly due to manufacturing tolerances and screen calibration.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. Orders &amp; Payment</h2>
            <p>
              An order is confirmed only after successful payment. We accept payments via Razorpay
              which supports UPI, credit/debit cards, and net banking. Dracnoir does not store any
              card or payment credentials on its servers.
            </p>
            <p>
              In the event of a payment failure, the amount will be refunded to your original payment
              method within 5–7 business days. If a confirmed order cannot be fulfilled due to stock
              unavailability, you will receive a full refund.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. Shipping &amp; Delivery</h2>
            <p>
              Orders are typically dispatched within 2–4 business days. Estimated delivery times
              are 5–10 business days depending on your location within India. Dracnoir is not
              responsible for delays caused by courier partners or force majeure events.
            </p>
            <p>
              Free shipping is available on orders above a specified threshold as advertised at the
              time of purchase. Shipping charges, if applicable, are displayed at checkout.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. Cancellations &amp; Returns</h2>
            <p>
              Orders can be cancelled before they are shipped. Once an order is marked as
              <strong className="text-foreground"> Shipped</strong> or{' '}
              <strong className="text-foreground">Delivered</strong>, it cannot be cancelled.
              You can cancel eligible orders directly from the <strong className="text-foreground">My Account → Orders</strong> section.
            </p>
            <p>
              Returns are accepted within 7 days of delivery for defective or incorrectly shipped
              items only. Items must be unused, unwashed, and in original packaging. To initiate a
              return, contact us at{' '}
              <a href="mailto:support@dracnoir.com" className="text-violet-500 hover:underline">
                support@dracnoir.com
              </a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">6. Intellectual Property</h2>
            <p>
              All content on Dracnoir — including logos, product designs, images, and text — is the
              property of Dracnoir or its licensors and is protected by applicable intellectual
              property laws. Anime characters and series names are trademarks of their respective
              owners. Dracnoir is an independent merchandise retailer and is not affiliated with
              any anime studio or publisher.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">7. User Accounts &amp; Community</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials.
              Any activity under your account is your responsibility. Dracnoir reserves the right
              to suspend or terminate accounts that violate these terms.
            </p>
            <p>
              Content posted in the Community section must not be offensive, defamatory, or in
              violation of any third-party rights. Dracnoir reserves the right to remove any
              community post that violates these guidelines without notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Dracnoir shall not be liable for any indirect,
              incidental, or consequential damages arising from your use of the platform or products.
              Our total liability in any dispute shall not exceed the amount paid for the order in question.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">9. Governing Law</h2>
            <p>
              These Terms &amp; Conditions are governed by the laws of India. Any disputes arising
              shall be subject to the exclusive jurisdiction of courts located in India.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">10. Contact Us</h2>
            <p>
              For any questions regarding these terms, please reach out to us at{' '}
              <a href="mailto:support@dracnoir.com" className="text-violet-500 hover:underline">
                support@dracnoir.com
              </a>.
            </p>
          </section>

        </div>

        <div className="rounded-xl border border-border bg-card/60 px-5 py-4 text-xs text-muted-foreground">
          By placing an order on Dracnoir you confirm that you have read and agree to these Terms &amp; Conditions.
        </div>
      </div>
    </AppShell>
  )
}
