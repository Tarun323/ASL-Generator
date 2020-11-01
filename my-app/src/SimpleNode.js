import React, {useEffect, useRef} from 'react';

const SimpleNode = React.memo(props => {  
  
  const pointerCapture = useRef(true);
    const pointerDown = e => {
      console.log("Node pointer down")
      props.onNodePointerDown(props.id)
    }
  
    const onConnectionEstablishStart = e => {
      console.log("Node connection Started by " + props.id);
      props.onInitConnection (props.id, props.x + 50, props.y);
    }
  
    // when connection is over this node then snap it to the node
    const onPointerMove = e => {
      console.log("ponter move");
      props.onPotentialConnection (props.id, props.x - 50, props.y)
    }

    return (
      <g transform={"translate(" + props.x + "," +  props.y +")"} onPointerMove = {onPointerMove}>
        <g onPointerDown={pointerDown}>
        <rect width = "100" height = "50" x = "-50" y = "-25" fill = "yellow" stroke = "black"/>
        <text x = "-30" y = "5" class="svgText" > {props.name}</text>
        </g>
        <circle cx = "50" cy = "0" r="5.5" fill = "green" stroke="black" onPointerDown = {onConnectionEstablishStart}/>
        <circle cx = "-50" cy = "0" r="5.5" fill = "red" stroke="black" />
      </g>
    )
  });
  
  export default SimpleNode;