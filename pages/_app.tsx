import "../styles/globals.css";
import type {AppProps} from "next/app";
import Head from "next/head";

function MyApp({Component, pageProps}: AppProps) {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
