import React from "react";
import Avatar from "./Avatar";
import Post from "./Post";

const Comment = ({ author, username, text, embeddedPost }) => {
  return (
    <div className="comment">
      <Avatar iconUrl={`https://sn.com/user/${username}/icon`} name={author}></Avatar>
      <strong>{author}</strong>: {text}
      {embeddedPost ? ( 
        <Post 
          author={embeddedPost.author}
          username={embeddedPost.username}
          content={embeddedPost.content}
          image={embeddedPost.image}
          comments={embeddedPost.comments}
        ></Post> ) : null }
    </div>
  );
};

export default Comment;
