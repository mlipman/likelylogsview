import {FC} from "react";
import {GetServerSideProps} from "next";
import ChatInterface from "../components/ChatInterface";

interface MyThingProps {
  data: string;
}

const Coach: FC<MyThingProps> = ({data}) => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome 2 to MyThing Page</h1>
      <p className="mb-4">{data}</p>
      <ChatInterface />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (_context) => {
  // Fetch your data here
  const data = "This is some server-side fetched data.";

  return {props: {data}};
};

export default Coach;
