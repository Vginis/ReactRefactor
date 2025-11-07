import React from "react";
import Comment from "./Comment";

const Post = ({ author, username, content, image, comments }) => {
  return (
    <div className="post">
      <div className="post-header">
        <Avatar iconUrl={`https://sn.com/user/${username}/icon`} name={author}></Avatar>
        <strong>{author}</strong>
      </div>
      <p>{content}</p>
      {image && <img src={image} alt="Post" className="post-image" />}
      <div className="comments-section">
        {comments.length > 0 ? (
          comments.map((c) => <Comment key={c.id} {...c} />)
        ) : (
          <p className="no-comments">No comments yet.</p>
        )}
      </div>
    </div>
  );
};

export default Post;
