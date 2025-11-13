import { default as MyPost } from "./Post.jsx";
import Avatar from "./Avatar.jsx";

const Feed = ({ username, name }) => {
  const posts = [
    {
      id: 1,
      author: "Jane Doe",
      username: "johndoe",
      content: "Just went hiking today! 🌲",
      image: "https://localhost:8000/400/250",
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
      <h2>Social Feed</h2>
      <Avatar iconUrl={`https://sn.com/users/${username}/icon`} name={name} />

      {posts.map((post) => (
        <MyPost key={post.id} {...post} />
      ))}

    </div>
  );
};

export default Feed;
