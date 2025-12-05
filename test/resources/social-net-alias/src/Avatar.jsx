
const Avatar = ({ iconUrl, name }) => {
  return (
    <div className="avatar">
      <img src={iconUrl} alt={name}/>
      <strong>{name}</strong>
    </div>
  );
};

class AvatarEx extends React.Component {
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

export {AvatarEx}

export default Avatar;
