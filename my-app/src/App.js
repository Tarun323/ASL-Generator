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
      <div class = "menu">
        <div>
          <MenuItem name = "State 1"/>
        </div>
        <div>
          <MenuItem name ="State 2"/>
        </div>
      </div>
      <div class = "main" >
        <GraphBase/>
      </div>
    </div>
  );
}

export default App;
