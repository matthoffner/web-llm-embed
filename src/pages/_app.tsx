import Head from "next/head";
import { AppProps } from "next/app";
import '../styles.css'

export interface MyAppProps extends AppProps {
  emotionCache?: any;
}

export default function MyApp(props: MyAppProps) {
  const { Component } = props;
  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <Component />
    </>
  );
}