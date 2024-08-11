import { FC } from "react";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { GetServerSideProps } from 'next';

interface LogEntry {
  message: string;
  creation_time: string;
  scope: string;
}

interface LogData {
  food: LogEntry[];
  meditation: LogEntry[];
  general: LogEntry[];
  fitness: LogEntry[];
  test: LogEntry[];
}

const sampleData: LogData = {
  food: [
    {
      message: "Finished a big binge day with pizza.",
      creation_time: "2024-07-24T01:22:04.924Z",
      scope: "reflection",
    },
    {
      message: "second food message.",
      creation_time: "2024-07-24T03:22:04.924Z",
      scope: "goal",
    },
    // Add a few more food entries here
  ],
  fitness: [
    {
      message:
        "Made PT appt and went! Got some good answers and a good plan to move forward.",
      creation_time: "2024-07-26T17:10:11.521Z",
      scope: "reflection",
    },
    // Add a few more fitness entries here
  ],
  meditation: [],
  general: [],
  test: [],
};

const LogEntryList: FC<{ entries: LogEntry[]; title: string }> = ({
  entries,
  title,
}) => {
  const formatDate = (dateString: string) => {
    const date = toZonedTime(parseISO(dateString), "America/Chicago");
    return format(date, "MMMM d, yyyy h:mm a");
  };

  return (
    <div>
      <h2>{title}</h2>
      {entries.length > 0 ? (
        <ul>
          {entries.map((entry, index) => (
            <li key={index}>
              <p>{entry.message}</p>
              <small>
                {formatDate(entry.creation_time)} ct - {entry.scope}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p>No entries yet.</p>
      )}
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const res = await fetch('https://mlipman-likelylogs.web.val.run/');
    const logData: LogData = await res.json();
    return { props: { logData } };
  } catch (error) {
    console.error('Failed to fetch log data:', error);
    return { props: { logData: { food: [], fitness: [], meditation: [], general: [], test: [] } } };
  }
};


const Home: FC<{logData: LogData}> = ({logData}) => {
  const categories = [
    { key: "food", display: "Food Entries" },
    { key: "fitness", display: "Fitness Entries" },
    { key: "meditation", display: "Meditation Entries" },
    { key: "general", display: "General Entries" },
    // { key: "test", display: "Test Entries" },
  ];
  return (
    <div>
      <h1> My Journal</h1>
      <h2>deploying to vercel, test commit</h2>
      {categories.map((category, index) => (
        <LogEntryList 
          entries={logData[category.key]} 
          title={category.display} 
          key={index} 
          />
      ))}
    </div>
  );
};

export default Home;
