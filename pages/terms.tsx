import {FC} from "react";
import Head from "next/head";

const Terms: FC = () => {
  return (
    <>
      <Head>
        <title>Terms and Conditions - Likely Logs</title>
      </Head>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: February 18, 2026</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">
              SMS Messaging Terms
            </h2>
            <p>
              By opting in to receive SMS messages from Likely Logs, you agree to the
              following terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Consent</h2>
            <p>
              By providing your phone number and opting in, you consent to receive SMS
              messages from Likely Logs. Message frequency may vary. Message and data
              rates may apply depending on your mobile carrier plan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Message Content</h2>
            <p>
              Messages may include meal planning reminders, cooking updates, shopping list
              notifications, and other content related to the Likely Logs application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Opt-Out</h2>
            <p>
              You can opt out at any time by replying STOP to any SMS message. After
              opting out, you will receive one final confirmation message and no further
              messages will be sent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Liability</h2>
            <p>
              Likely Logs is provided as-is. We are not responsible for any delays or
              failures in SMS delivery due to carrier issues or technical difficulties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">
              Changes to These Terms
            </h2>
            <p>
              We may update these terms from time to time. Continued use of the SMS
              service after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Contact</h2>
            <p>
              For questions about these terms, contact Michael Lipman at michael.b.lipman
              at gmail dot com
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default Terms;
