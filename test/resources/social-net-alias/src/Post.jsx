import { WrappedComment as Comment } from "./Comment.jsx";
import Avatar from "./Avatar.jsx";

const Post = ({ author, username, content, image, comments }) => {
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
};

function Wrapper(component, optionalParams){
  return component
}

function connect(params){
  console.log('do nothing')

  function otherFunction(component){
    return component
  }
  return otherFunction
}

const ConnectedPost = connect({x: 0, y:0})(Post)

const LocalWrappedPost = Wrapper(Post, "param")

const WrappedPost = Wrapper(Post, "param")

export {WrappedPost}

export default Wrapper(Post);
