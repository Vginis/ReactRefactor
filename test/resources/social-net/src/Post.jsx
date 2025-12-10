import {PostComment as XComment, Avatar as XAvatar} from "./components.jsx";

const Post = ({ author, username, content, image, comments }) => {
  return (
    <div className="post">
      <div className="post-header">
        <XAvatar iconUrl={`https://localhost:8000/user/${username}/icon`} name={author}></XAvatar>
        <strong>{author}</strong>
      </div>
      <p>{content}</p>
      {image && <img src={image} alt="Post" className="post-image" />}
      <div className="comments-section">
        {comments ? (
          comments.map((c) => <XComment key={c.id} {...c} />)
        ) : (
          <p className="no-comments">No comments yet.</p>
        )}
      </div>
    </div>
  );
};

export const Logo = ({ iconUrl, text }) => {
  return (
    <div className="logo">
      <img src={iconUrl} alt={text}/>
      <strong>{text}</strong>
    </div>
  );
};

function wrapper(component){
  return component;
}

export default wrapper(React.memo(Post));
