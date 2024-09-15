import { FC, useState } from "react";
import { GetServerSideProps } from "next";


interface Comment {
  id: string;
  text: string;
  children?: Comment[];
}

interface HomeProps {
  comments: Comment[];
}

const Home: FC<HomeProps> = ({ comments }) => {
  return <CommentTreeView comments={comments} />;
};


interface CommentBoxProps {
  text: string;
  isSelected: boolean;
  onClick: () => void;
}

const truncateText = (text: string): string => {
  const words = text.split(' ');
  if (words.length > 200) {
    return words.slice(0, 200).join(' ') + '...';
  }
  return text;
};

const CommentBox: FC<CommentBoxProps> = ({ text, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`p-4 m-2 border rounded cursor-pointer ${isSelected ? "bg-blue-100" : "bg-gray-100"}  h-full overflow-auto`}
    style={{ maxHeight: '300px' }}
  >
    <div className="prose" dangerouslySetInnerHTML={{ __html: truncateText(text) }} />
  </div>
);

interface CommentRowProps {
  comments: Comment[];
}

const CommentRow: FC<CommentRowProps> = ({ comments }) => {
  const [rowSelectionId, setRowSelectionId] = useState<string | null>(null);
  const handleClick = (id: string) => {
    setRowSelectionId(id);
  };

  // Reorder comments to put the selected one first
  const orderedComments = [...comments].sort((a, b) => {
    if (a.id === rowSelectionId) return -1;
    if (b.id === rowSelectionId) return 1;
    return 0;
  });

  return (
    <div className="w-full">
      <div className="flex flex-row w-full">
        {comments.slice(0,3).map((comment) => (
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

const CommentTreeView: FC<{ comments: Comment[] }> = ({ comments }) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <CommentRow comments={comments} />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const storyId = 41540902;

  try {
    const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${storyId}.json`);
    const storyData = await storyResponse.json();
    console.log(storyData);

    const fetchComment = async (id: number): Promise<Comment> => {
      const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      const data = await response.json();
      const children = await Promise.all((data.kids || []).map(fetchComment));
      return {
        id: data.id.toString(),
        text: data.text || '',
        children: children.length > 0 ? children : null
      };
    };

    const comments = await Promise.all((storyData.kids || []).slice(0,100).map(fetchComment));

    return { props: { comments } };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { props: { comments: [] } };
  }
};

export default Home;
