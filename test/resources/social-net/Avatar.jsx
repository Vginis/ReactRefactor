import React from "react";

const Avatar = ({ iconUrl, name }) => {
  return (
    <div className="avatar">
      <img src={iconUrl} alt={name}/>
      <strong>{name}</strong>
    </div>
  );
};

export default Avatar;
