import {FC} from "react";
import Head from "next/head";

const Privacy: FC = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy - Likely Logs</title>
      </Head>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: February 18, 2026</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Overview</h2>
            <p>
              Likely Logs is a personal application operated by Michael Lipman. This
              privacy policy describes how we handle information in connection with our
              SMS messaging service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">
              Information We Collect
            </h2>
            <p>
              We collect only the phone numbers of consenting individuals who opt in to
              receive SMS messages. We do not collect, store, or share any additional
              personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">
              How We Use Your Information
            </h2>
            <p>
              Phone numbers are used solely to send SMS messages related to Likely Logs
              functionality, such as meal planning reminders and cooking updates. We do
              not use your information for marketing to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Data Sharing</h2>
            <p>
              We do not sell, rent, or share your personal information with third parties.
              Phone numbers may be shared only with our SMS delivery provider (e.g.,
              Twilio) solely for the purpose of delivering messages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Data Retention</h2>
            <p>
              We retain your phone number only as long as you remain opted in to receive
              messages. Upon opting out, your phone number will be removed from our
              messaging list.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Opt-Out</h2>
            <p>
              You may opt out of receiving SMS messages at any time by replying STOP to
              any message. You may also contact us directly to request removal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Contact</h2>
            <p>
              For questions about this privacy policy, contact Michael Lipman at
              michael.b.lipman at gmail dot com
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default Privacy;
