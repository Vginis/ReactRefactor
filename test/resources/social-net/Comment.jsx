import React from "react";
import Avatar from "./Avatar";

const Comment = ({ author, username, text }) => {
  return (
    <div className="comment">
      <Avatar iconUrl={`https://sn.com/user/${username}/icon`} name={author}></Avatar>
      <strong>{author}</strong>: {text}
    </div>
  );
};

export default Comment;
