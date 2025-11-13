import Avatar from "./Avatar.jsx";
import Post from "./Post.jsx";

const Comment = ({ author, username, text, embeddedPost }) => {
  return (
    <div className="comment">
      <Avatar iconUrl={`https://localhost:8000/user/${username}/icon`} name={author}></Avatar>
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
