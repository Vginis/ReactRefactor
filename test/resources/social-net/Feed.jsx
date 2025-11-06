import React from "react";
import Post from "./Post";

const Feed = () => {
  const posts = [
    {
      id: 1,
      author: "Jane Doe",
      content: "Just went hiking today! 🌲",
      image: "https://placekitten.com/400/250",
      comments: [
        { id: 1, author: "Mike", text: "Looks awesome!" },
        { id: 2, author: "Anna", text: "Where is this?" },
      ],
    },
    {
      id: 2,
      author: "John Smith",
      content: "Coffee is life ☕",
      image: null,
      comments: [],
    },
  ];

  return (
    <div className="feed">
      <h2>Social Feed</h2>
      {posts.map((post) => (
        <Post key={post.id} {...post} />
      ))}
    </div>
  );
};

export default Feed;
