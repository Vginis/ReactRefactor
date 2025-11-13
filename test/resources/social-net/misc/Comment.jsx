import Avatar from "./Avatar.jsx";

const Comment = ({ author, username, text }) => {
  return (
    <div className="comment">
      <Avatar iconUrl={`https://localhost:8000/user/${username}/icon`} name={author}></Avatar>
      <strong>{author}</strong>: {text}
    </div>
  );
};

export default Comment;
