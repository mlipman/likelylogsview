import { FC } from "react";

const Home: FC<{}> = ({}) => {
  return (
    <CommentTreeView />
  );
};



const CommentBox = ({ text, isSelected, width }) => (
  <div
    className={`p-4 m-2 border rounded ${isSelected ? "bg-blue-100" : "bg-gray-100"}`}
    style={{ width }}
  >
    {text}
  </div>
);

const CommentTreeView = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Row 1: Root comment */}
      <div className="flex mb-4">
        <CommentBox text="Root Comment" isSelected={false} width="100%" />
      </div>

      {/* Row 2: Direct replies */}
      <div className="flex mb-4">
        <CommentBox text="Selected Reply 1" isSelected={true} width="50%" />
        <div className="flex w-1/2">
          <CommentBox text="Reply 2" isSelected={false} width="33.33%" />
          <CommentBox text="Reply 3" isSelected={false} width="33.33%" />
          <CommentBox text="Reply 4" isSelected={false} width="33.33%" />
        </div>
      </div>

      {/* Row 3: Children of selected reply */}
      <div className="flex">
        <CommentBox text="Child 1" isSelected={false} width="25%" />
        <CommentBox text="Child 2" isSelected={false} width="25%" />
        <CommentBox text="Child 3" isSelected={false} width="25%" />
        <CommentBox text="Child 4" isSelected={false} width="25%" />
      </div>
    </div>
  );
};


export default Home;
