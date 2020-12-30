import React, {useEffect, useState} from 'react';
import './App.css';
import GraphBase from './GraphBase'

function MenuItem (props) {
  const drag = e => {
    e.dataTransfer.setData("name", 'name' in props ? props.name : "state");
  }
  return (
    <p class="text-style" draggable = "true" onDragStart={drag}>{props ? props.name : "state"}</p>
  )
}


function App() {
  return (
    <div class="App">
      <div id ="menu" class = "menu">
        <div>
          <MenuItem displayName = "PASS state" name = "PASS"/>
        </div>
        <div>
          <MenuItem displayName ="DUMMY State" name = "SIMPLE"/>
        </div>
      </div>
      <div class = "main" id="main">
        <GraphBase/>
      </div>
    </div>
  );
}

export default App;
