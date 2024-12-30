import Log from "@/components/Log";
import {FC, useState, useEffect} from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import {log} from "@prisma/client";
import {useRouter} from "next/router";

const OneLog: FC = () => {
  const [fetchedMeal, setFetchedMeal] = useState<log | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const router = useRouter();
  const {id} = router.query;

  const getEnrichment = async () => {
    const response = await fetch(`/api/logs?enrich=1&id=${id}`);
    const data = await response.json();
    setMessage(data.messageContent);
  };
  const fetchLog = async () => {
    const response = await fetch(`/api/logs?id=${id}`);
    const data = await response.json();
    setFetchedMeal(data);
    setLoading(false);
  };
  useEffect(() => {
    fetchLog();
  }, [id]);
  return loading || fetchedMeal == null ? (
    <div className="flex justify-center mb-4">
      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ) : (
    <>
      <Log meal={fetchedMeal} />
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        onClick={getEnrichment}
      >
        Enrich
      </button>
      <ReactMarkdown
        className="text-gray-600 mb-4"
        remarkPlugins={[remarkBreaks]}
      >
        {message}
      </ReactMarkdown>
    </>
  );
};
export default OneLog;
