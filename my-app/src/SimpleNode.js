import React, {useEffect, useRef} from 'react';

const SimpleNode = React.memo(props => {  
  const nodeHeight = 100;
  const nodeWidth = 150;
  const nodeX2 = nodeWidth/2;
  const nodeY2 = nodeHeight/2;
  const nodeX1 = -1 * nodeX2;
  const nodeY1 = -1 * nodeY2;
  const nodeT = nodeWidth/4;
  const nodeType = "SIMPLE";

  const pointerCapture = useRef(true);
    const pointerDown = e => {
      console.log("Node pointer down")
      props.onNodePointerDown(props.id)
      e.stopPropagation();
    }
  
    const onConnectionEstablishStart = e => {
      console.log("Node connection Started by " + props.id);
      props.onInitConnection (props.id, props.x + (nodeWidth / 2), props.y);
    }
  
    // when connection is over this node then snap it to the node
    const onPointerMove = e => {
      props.onPotentialConnection (props.id, props.x - (nodeWidth / 2), props.y)
    }

    const renderPassState = () => {
      
    }

    return (
      <g transform={"translate(" + props.x + "," +  props.y +")"} onPointerMove = {onPointerMove}>
        <g onPointerDown={pointerDown}>
          <rect width = {nodeWidth} height = {nodeHeight} x = {nodeX1} y = {nodeY1} fill = "yellow" stroke = "black"/>
          <rect width = {nodeT} height = {nodeHeight} x = {nodeX1} y = {nodeY1} fill = "black" stroke = "black"/>
          <text x = {nodeY1 + 20} y = {nodeX1 + 25} class="rotatedText" > {nodeType} </text>
          
          <text x = "-30" y = "5" class="svgText" > {props.name}</text>
        </g>
        <circle cx = {nodeX2} cy = "0" r="5.5" fill = "green" stroke="black" onPointerDown = {onConnectionEstablishStart}/>
        <circle cx = {nodeX1} cy = "0" r="5.5" fill = "red" stroke="black" />
      </g>
    )
  });
  
  export default SimpleNode;