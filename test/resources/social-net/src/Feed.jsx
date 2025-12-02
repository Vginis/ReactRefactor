import {default as MyPost} from "./Post.jsx";
import {Logo} from "./Post.jsx"
import {Avatar, AvatarEx, AvatarClass} from "./components.jsx";

export default function({username, name}){
  const posts = [
    {
      id: 1,
      author: "Jane Doe",
      username: "johndoe",
      content: "Just went hiking today! 🌲",
      image: "https://localhost:8000/400/250",
      comments: [
        { id: 1, author: "Mike", username: "mike", text: "Looks awesome!" },
        { id: 2, author: "Anna", username: "anna", text: "Where is this?" },
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
      <Logo iconUrl={`https://localhost:8000/logo`} text={"Social net"}></Logo>
      <Avatar iconUrl={`https://localhost:8000/users/${username}/icon`} name={name}/>

      {posts.map((post) => (
        <MyPost key={post.id} {...post} />
      ))}

    </div>
  );
};
