import Comment from "./Comment.jsx";
import Avatar from "./Avatar.jsx";

function forwardRef(component){
  return component
}

const Post = forwardRef(function Post({ author, username, content, image, comments }) {
  return (
    <div className="post">
      <div className="post-header">
        <Avatar iconUrl={`https://localhost:8000/user/${username}/icon`} name={author}></Avatar>
        <strong>{author}</strong>
      </div>
      <p>{content}</p>
      {image && <img src={image} alt="Post" className="post-image" />}
      <div className="comments-section">
        {comments ? (
          comments.map((c) => <Comment key={c.id} {...c} />)
        ) : (
          <p className="no-comments">No comments yet.</p>
        )}
      </div>
    </div>
  );
});

export default Post;
