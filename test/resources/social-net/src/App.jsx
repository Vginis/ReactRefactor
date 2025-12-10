import {default as Feed} from "./Feed.jsx";

function App() {
  return (
    <div className="App">
      <Feed name="Mary Jones" username="maryj" />
    </div>
  );
}

function WrapperComponent(props){
  return <App {...props}/>
}

export default React.memo(WrapperComponent);
