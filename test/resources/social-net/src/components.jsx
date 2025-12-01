const AvatarEx = class extends React.Component {
  render() {
    const { iconUrl, name } = this.props;

    return (
      <div className="avatarex">
        <img src={iconUrl} alt={name} />
        <em>{name}</em>
      </div>
    );
  }
}

class AvatarClass extends React.Component {
  render() {
    const { iconUrl, name } = this.props;

    return (
      <div className="avatarex">
        <img src={iconUrl} alt={name} />
        <em>{name}</em>
      </div>
    );
  }
}

function Avatar({ iconUrl, name }){
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


export {Comment as PostComment, Avatar, AvatarEx, AvatarClass}

