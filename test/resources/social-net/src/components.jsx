const Avatar = ({ iconUrl, name }) => {
  return (
    <div className="avatar">
      <img src={iconUrl} alt={name}/>
      <strong>{name}</strong>
    </div>
  );
};


const Comment = ({ author, username, text }) => {
  return (
    <div className="comment">
      <Avatar iconUrl={`https://localhost:8000/user/${username}/icon`} name={author}></Avatar>
      <strong>{author}</strong>: {text}
    </div>
  );
};

export {Comment, Avatar}

