import { FC, useState } from "react";

interface Comment {
  id: string;
  text: string;
  children?: Comment[];
}

const Home: FC<{}> = ({}) => {
  return <CommentTreeView />;
};

interface CommentBoxProps {
  text: string;
  isSelected: boolean;
  onClick: () => void;
}

const CommentBox: FC<CommentBoxProps> = ({ text, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`p-4 m-2 border rounded cursor-pointer ${isSelected ? "bg-blue-100" : "bg-gray-100"}  h-full`}
  >
    {text}
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
      {orderedComments.map((comment) => (
      <div 
        key={comment.id} 
        className="flex-grow"
        style={{ flexGrow: rowSelectionId === comment.id ? 2 : 1, flexBasis: 0 }}
      >
        <CommentBox
          text={comment.id}
          isSelected={rowSelectionId === comment.id}
          onClick={() => handleClick(comment.id)}
        />
      </div>
      ))}
    </div>
      {rowSelectionId && (
        <div className="w-full mt-2">
          {comments.find(c => c.id === rowSelectionId)?.children && (
            <CommentRow comments={comments.find(c => c.id === rowSelectionId)!.children!} />
          )}
        </div>
      )}
      </div>
      );
      };

const CommentTreeView = () => {
  const parents = [
    {
      id: "1",
      text: "parent 1",
      children: [
        {
          id: "1-1",
          text: "Reply 2",
          children: [
            { id: "1-1-1", text: "Reply 2" },
            { id: "1-1-2", text: "Reply 3" },
            { id: "1-1-3", text: "Reply 4" },
          ],
        },
        { id: "1-2", text: "Reply 3" },
        { id: "1-3", text: "Reply 4" },
      ],
    },
    {
      id: "2",
      text: "parent 1",
      children: [
        { id: "2-1", text: "Reply 2" },
        { id: "2-2", text: "Reply 3" },
        { id: "2-3", text: "Reply 4" },
      ],
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <CommentRow comments={parents} />
    </div>
  );
};

export default Home;
