import React from "react";

const Comment = ({ author, text }) => {
  return (
    <div className="comment">
      <strong>{author}</strong>: {text}
    </div>
  );
};

export default Comment;
