import { default as MyPost } from "./Post.jsx";
import Avatar from "./Avatar.jsx";
import { AvatarEx as AvatarEx2, Avatar as Avatar2, WrappedComment as Comment} from "./components.jsx";

const Feed = ({ username, name }) => {
  const posts = [
    {
      id: 1,
      author: "Jane Doe",
      username: "johndoe",
      content: "Just went hiking today! 🌲",
      image: "https:/localhost:8000/400/250",
      comments: [
        { id: 1, author: "Mike", username: "mike", text: "Looks awesome!" },
        {
          id: 2, author: "Anna", username: "anna", text: "Where is this?",
          embeddedPost: {
            id: 3,
            author: "Mary Jones",
            username: "mary",
            content: "Best hiking places",
            image: "https://localhost:8000/images/123"
          }
        },
      ],
    },
    {
      id: 2,
      author: "John Smith",
      username: "johnsmith",
      content: "Coffee is life ☕",
      image: null,
      comments: [],
    },
  ];

  return (
    <div className="feed">
      <h2>Social Feed 2</h2>
      <Avatar iconUrl={`https://localhost:8000/users/${username}/icon`} name={name} />
      <Avatar2 iconUrl={`https://localhost:8000/users/${username}/icon`} name={name} />

      {posts.map((post) => (
        <MyPost key={post.id} {...post} />
      ))}

    </div>
  );
};

function connect(params){
  console.log('do nothing')

  function otherFunction(component){
    return component
  }
  return otherFunction
}

export default connect()(Feed);
