import Avatar from "./Avatar.jsx";
import {default as Component} from "./Post.jsx";

const Comment = ({ author, username, text, embeddedPost }) => {
  return (
    <div className="comment">
      <Avatar iconUrl={`https://localhost:8000/user/${username}/icon`} name={author}></Avatar>
      <strong>{author}</strong>: {text}
      {embeddedPost ? ( 
        <Component 
          author={embeddedPost.author}
          username={embeddedPost.username}
          content={embeddedPost.content}
          image={embeddedPost.image}
          comments={embeddedPost.comments}
        ></Component> ) : null }
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

const WrappedComment = connect({x: 0, y:0})(Comment)

export  { WrappedComment };
