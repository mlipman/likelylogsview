import {FC, useState, FormEvent, useEffect, useCallback} from "react";
import {useRouter} from "next/router";

interface Comment {
  id: string;
  text: string;
  children?: Comment[];
}

const Home: FC = () => {
  const [storyId, setStoryId] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storyIdFromQuery = router.query.storyId
      ? Number(router.query.storyId)
      : null;
    if (storyIdFromQuery !== storyId) {
      setStoryId(storyIdFromQuery);
    }
  }, [router.query.storyId, storyId]);

  // maybe some refactor opportunities to simplify the two fetch methods
  const fetchComment = useCallback(async (id: number): Promise<Comment> => {
    const response = await fetch(
      `https://hacker-news.firebaseio.com/v0/item/${id}.json`
    );
    const data = await response.json();
    const children = await Promise.all((data.kids || []).map(fetchComment));
    return {
      id: data.id.toString(),
      text: data.text || "",
      children: children.length > 0 ? children : undefined,
    };
  }, []);

  const fetchComments = useCallback(
    async (storyId: number) => {
      setIsLoading(true);
      try {
        const urlBase = "https://hacker-news.firebaseio.com/v0/item";
        const storyResponse = await fetch(`${urlBase}/${storyId}.json`);
        const storyData = await storyResponse.json();

        const fetchedComments = await Promise.all(
          (storyData.kids || []).slice(0, 100).map(fetchComment)
        );
        setComments(fetchedComments);
      } catch (error) {
        console.error("Error fetching comments:", error);
        setComments([]);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchComment]
  );

  useEffect(() => {
    if (storyId !== null) {
      router.push(`/?storyId=${storyId}`, undefined, {shallow: true});
      fetchComments(storyId);
    }
  }, [storyId, router, fetchComments]);

  const handleNewsIdSubmit = (incomingId: number | null) =>
    setStoryId(incomingId);

  return (
    <div>
      <InputBox passThroughSubmit={handleNewsIdSubmit} />
      {isLoading ? (
        <div>Loading comments...</div>
      ) : (
        <CommentTreeView comments={comments} />
      )}
    </div>
  );
};

interface CommentBoxProps {
  text: string;
  isSelected: boolean;
  onClick: () => void;
}

const truncateText = (text: string): string => {
  const words = text.split(" ");
  if (words.length > 200) {
    return words.slice(0, 200).join(" ") + "...";
  }
  return text;
};

const CommentBox: FC<CommentBoxProps> = ({text, isSelected, onClick}) => (
  <div
    onClick={onClick}
    className={`p-4 m-2 border rounded cursor-pointer ${
      isSelected ? "bg-blue-100" : "bg-gray-100"
    }  h-full overflow-auto`}
    style={{maxHeight: "300px"}}
  >
    <div
      className="prose"
      dangerouslySetInnerHTML={{__html: truncateText(text)}}
    />
  </div>
);

interface CommentRowProps {
  comments: Comment[];
}

const CommentRow: FC<CommentRowProps> = ({comments}) => {
  const [rowSelectionId, setRowSelectionId] = useState<string | null>(null);
  const handleClick = (id: string) => {
    setRowSelectionId(id);
  };

  // Reorder comments to put the selected one first
  // const orderedComments = [...comments].sort((a, b) => {
  //   if (a.id === rowSelectionId) return -1;
  //   if (b.id === rowSelectionId) return 1;
  //   return 0;
  // });

  return (
    <div className="w-full">
      <div className="flex flex-row w-full">
        {comments.slice(0, 3).map((comment) => (
          <div
            key={comment.id}
            className="flex-grow"
            style={{
              flexGrow: rowSelectionId === comment.id ? 3 : 1,
              flexBasis: 0,
            }}
          >
            <CommentBox
              text={comment.text}
              isSelected={rowSelectionId === comment.id}
              onClick={() => handleClick(comment.id)}
            />
          </div>
        ))}
      </div>
      {rowSelectionId && (
        <div className="w-full mt-2">
          {comments.find((c) => c.id === rowSelectionId)?.children && (
            <CommentRow
              comments={
                comments.find((c) => c.id === rowSelectionId)!.children!
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

interface InputBoxProps {
  passThroughSubmit: (input: number | null) => void;
}
const InputBox: FC<InputBoxProps> = ({passThroughSubmit}) => {
  const [input, setInput] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(input);
    setInput("");
    const match = input.match(/[?&]id=(\d+)/);
    const hnId = match ? parseInt(match[1]) : null;
    passThroughSubmit(hnId);
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2 mb-4">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        type="text"
        className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter Hacker News url"
      />
      <button
        type="submit"
        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Go
      </button>
    </form>
  );
};

const CommentTreeView: FC<{comments: Comment[]}> = ({comments}) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <CommentRow comments={comments} />
    </div>
  );
};
/*
export const getServerSideProps: GetServerSideProps = async (context) => {
  const storyId = 41540902;

  try {
    const storyResponse = await fetch(
      `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`,
    );
    const storyData = await storyResponse.json();
    console.log(storyData);

    const fetchComment = async (id: number): Promise<Comment> => {
      const response = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      );
      const data = await response.json();
      const children = await Promise.all((data.kids || []).map(fetchComment));
      return {
        id: data.id.toString(),
        text: data.text || "",
        children: children.length > 0 ? children : null,
      };
    };

    const comments = await Promise.all(
      (storyData.kids || []).slice(0, 100).map(fetchComment),
    );

    return { props: { comments } };
  } catch (error) {
    console.error("Error fetching comments:", error);
    return { props: { comments: [] } };
  }
};
*/
export default Home;
