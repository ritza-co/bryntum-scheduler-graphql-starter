import { useRef, LegacyRef } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { BryntumScheduler } from "@bryntum/scheduler-react";

const SchedulerDynamic = dynamic(() => import("@/components/Scheduler"), {
  ssr: false,
  loading: () => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <p>Loading...</p>
      </div>
    );
  },
});

export default function Home() {
  const schedulerRef = useRef() as LegacyRef<BryntumScheduler> | undefined;

  return (
    <>
      <Head>
        <title>
          Create a scheduler using Bryntum, Next.js, Prisma, SQLite and GraphQL
        </title>
        <meta
          name="description"
          content="Create a scheduler using Bryntum, Next.js, Prisma, SQLite and GraphQL"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/bryntum.png" />{" "}
      </Head>
      <div id="scheduler-container">
        <SchedulerDynamic schedulerRef={schedulerRef} />
      </div>
    </>
  );
}
