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

class Avatar extends React.Component {
  render() {
    const { iconUrl, name } = this.props;

    return (
      <div className="avatar">
        <Icon iconUrl={iconUrl} text={name} />
        <strong>{name}</strong>
      </div>
    );
  }
}

export const Icon = ({ iconUrl, text }) => {
  return (
    <img src={iconUrl} alt={text} />
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


export { Comment as PostComment, Avatar, AvatarEx, AvatarClass }

