import React from "react";
import Comment from "./Comment";

const Post = ({ author, content, image, comments }) => {
  return (
    <div className="post">
      <div className="post-header">
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
