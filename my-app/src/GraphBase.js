import React, {useEffect, useState, useRef, useCallback} from 'react';
import Connection from './Connection';
import SimpleNode from './SimpleNode'
const uuid = require('uuid/v4')

function GraphBase (props) {
    const [nodeStates, setNodeStates] = useState([])
    const [lineStates, setLineStates] = useState([])
    const [tempLineState, setTempLineState] = useState({})
    const selectedNodeId = useRef(-1)
    const pointerOnNode = useRef(false)
    const isConnectionBeingEstablished = useRef(false)
    const [viewBox, setViewBox] = useState([0, 0, 0, 0])
    const [viewPort, setViewPort] = useState ([100, 100])
    const tryingToPan = useRef(false)
    const panDownPos = useRef([0, 0]);
    const zoomScale = useRef([1,1]); 
    const svg = useRef();

    // handle zoom in and zoom out 
    const onMouseWheel = ( e => {
      console.log("Mouse Scroll");
      let w = viewBox[2];
      let h = viewBox[3];
      let mx = e.offsetX;  
      let my = e.offsetY;    
      let dw = -1 * w*Math.sign(e.deltaY)*0.05;
      let dh = -1 * h*Math.sign(e.deltaY)*0.05;
      let dx = dw*mx/viewPort[0];
      let dy = dh*my/viewPort[1];

      // making local variables because setViewBox is async
      let viewBoxX = viewBox[0] + dx;
      let viewBoxY = viewBox[1] + dy;
      let viewBoxW = viewBox[2] - dw;
      let viewBoxH = viewBox[3] - dh;

      console.log ("W :" + w + " H : " + h + " MX : " + mx + " MY : " + my + " DW : " + dw + " DH : " + dh + " DX : " + dx + " DY : " + dy);
      setViewBox([viewBoxX, viewBoxY, viewBoxW, viewBoxH]);
      // zoom realtive to viewPort;
      zoomScale.current = [viewPort[0] / viewBoxW, viewPort[1] / viewBoxH]
    })


    useEffect(()=>{
      // set the view port to match the screen dimensions initially
      let doc = document.getElementById('main')
      setViewBox([0 ,0, doc.clientWidth, doc.clientHeight])
      setViewPort([doc.clientWidth, doc.clientHeight])
      console.log(doc.clientWidth, doc.clientHeight);
      tempLineState.id = uuid()
      resetTempLineState()
    },[])

    useEffect(() => {
      window.addEventListener('wheel', onMouseWheel);
      return () => {
        //window.removeEventListener('resize', handleResize); 
        window.removeEventListener('wheel', onMouseWheel);
      }

    }, [onMouseWheel])


    // resets the temporary connection, equivalent to removing the connection
    const resetTempLineState = () => {
      tempLineState.x1 = 0
      tempLineState.y1 = 0
      tempLineState.x2 = 0
      tempLineState.y2 = 0
      tempLineState.fromId = -1
      tempLineState.toId = -1
      setTempLineState({...tempLineState})
    }
    
    // starts the connection between two nodes
    const onInitConnection = (id, x, y) => {
      tempLineState.x1 = x
      tempLineState.y1 = y
      tempLineState.x2 = x
      tempLineState.y2 = y
      tempLineState.fromId = id
      isConnectionBeingEstablished.current = true
      setTempLineState({...tempLineState})
    }
    
    const onMove = e => {
      // Node is being dragged
      if (selectedNodeId.current !== -1){
        // get the node specifications 
        let nodeObj = nodeStates.find (obj => obj.id === selectedNodeId.current)
        const [mousePosX, mousePosY] = transfromToViewBoxCoordinates(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
        let diffX = mousePosX - nodeObj.x
        let diffY = mousePosY - nodeObj.y
        nodeObj.x += diffX 
        nodeObj.y += diffY
        setNodeStates([...nodeStates])
        // move the connections that are connected to the node 
        // move the incoming connections
        let change = false;
        if (nodeObj.incomingIds !== undefined) {
          let affectedFromLines = lineStates.filter(obj => nodeObj.incomingIds.includes(obj.id))
          affectedFromLines.forEach(line => {line.x2 += diffX; line.y2 += diffY})
          change = true;
        }
        if (nodeObj.outgoingIds !== undefined) {
          let affectedToLines = lineStates.filter(obj => nodeObj.outgoingIds.includes(obj.id))
          affectedToLines.forEach(line => {line.x1 += diffX; line.y1 += diffY})
          change = true;
        }
        if (change) setLineStates([...lineStates])
      }

      // trying to pan
      else if (tryingToPan.current) {
        console.log("Trying to PAN");
        let diffX = panDownPos.current[0] - e.nativeEvent.offsetX
        let diffY = panDownPos.current[1] - e.nativeEvent.offsetY
        panDownPos.current = [e.nativeEvent.offsetX, e.nativeEvent.offsetY]
        setViewBox([viewBox[0] + diffX, viewBox[1] + diffY, viewBox[2], viewBox[3]]) 
      }

      // connection is being established between two nodes
      // if the pointer is on a potential node then, these properties are already set, dont change them
      else if (isConnectionBeingEstablished.current && !pointerOnNode.current) {
        const [mousePosX, mousePosY] = transfromToViewBoxCoordinates(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
        tempLineState.x2 = mousePosX
        tempLineState.y2 = mousePosY
        tempLineState.toId = -1;
        setTempLineState({...tempLineState})
      }
      pointerOnNode.current = false;
    }
    
    const onPotentialConnection = (id, x, y) => {
      // if connection hasn't started then dont do anything
      if (tempLineState.fromId == -1) return;

      // snap the connection to the nearest node
      pointerOnNode.current = true
      // if already set then dont update state again
      if (tempLineState.x2 === x && tempLineState.y2 === y && tempLineState.toId === id)
        return;
      tempLineState.x2 = x
      tempLineState.y2 = y
      tempLineState.toId = id
      
      setTempLineState({...tempLineState})
    } 

    const onUp = e => {
      tryToEstablishConnection()
      // deselect the node 
      selectedNodeId.current = -1
      // no longer trying to pan
      tryingToPan.current = false;
      resetTempLineState()
      isConnectionBeingEstablished.current = false
    }

    const tryToEstablishConnection = () => {
      if (tempLineState.toId === -1) {
        console.log("Valid connection not established");
        return;
      }
      if (tempLineState.fromId == tempLineState.toId) {
        console.log('Cannot establish connection within the same component.')
        return;
      }
      // create a new connection 
      // TODO verify if connection is possible from the backend
      let connectionId = uuid()
      let newConnectionObj = {'id' : connectionId, 'x1' : tempLineState.x1, 'y1' : tempLineState.y1, 'x2' : tempLineState.x2, 'y2' : tempLineState.y2}
      setLineStates([...lineStates, newConnectionObj])
      // update the nodes about the connection
      let connEndNode = nodeStates.find(obj => obj.id == tempLineState.toId)
      connEndNode.incomingIds.push(connectionId);
      let connStartNode = nodeStates.find(obj => obj.id == tempLineState.fromId)
      connStartNode.outgoingIds.push(connectionId)
      setNodeStates([...nodeStates])
    }
    
    // when a new node is dropped in the view space,
    // we initialize the node here 
    const drop = e => {
      let nodeName = e.dataTransfer.getData("name")
      if (!nodeName)
        return;
      console.log(e.nativeEvent.offsetX + " : " + e.nativeEvent.offsetY);
      const [x, y] = transfromToViewBoxCoordinates(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
      let state = {'id' : uuid(), 'name' : nodeName, 'x' : x, 'y' : y, 
                'outgoingIds' : [], 'incomingIds' : []}
      setNodeStates([...nodeStates, state])
    }

    const transfromToViewBoxCoordinates = (x, y) => {
      x = (x / zoomScale.current[0]) + viewBox[0]
      y = (y / zoomScale.current[1]) + viewBox[1]
      
      return [x, y]
    }

    // save the id of the node that has been selected
    const onNodePointerDown = (id) => {
      selectedNodeId.current = id
    }

    const allowdrop = e=> {
      e.preventDefault();
    }

    const onPointerDown = e => {
      // if the pointer is down on the graph area and not on any node then we can pan around
      if (selectedNodeId.current === -1 && isConnectionBeingEstablished.current === false) {
          console.log("Mouse down in Graph base");
          tryingToPan.current = true;
          panDownPos.current = [e.nativeEvent.offsetX, e.nativeEvent.offsetY]
      }
    }


    return (
      <svg id = "svgID" ref = {svg} onPointerLeave={onUp} onPointerDown={onPointerDown} preserveAspectRatio = "none" width={viewPort[0]} height={viewPort[1]} viewBox = {viewBox.join(" ")} onDrop={drop} onDragOver={allowdrop} onPointerMove = {onMove} onPointerUp = {onUp} overflow="scroll">
        // the arrow head which is used in the connections
        <defs>
          <marker id="markerArrow" markerWidth="13" markerHeight="13" refX="10" refY="5"
              orient="auto">
              <path d="M2,2 L2,8 L12,5 L2,2" />
          </marker>
        </defs>
        
        // nodes
        {nodeStates.map(obj => 
          <SimpleNode key = {obj.id} id = {obj.id} name = {obj.name} x = {obj.x} y = {obj.y} onNodePointerDown = {onNodePointerDown} 
          onInitConnection = {onInitConnection} onPotentialConnection = {onPotentialConnection}/>)}

        // temporary connection 
        {
          isConnectionBeingEstablished.current &&
          <Connection key = {tempLineState.id} x1 = {tempLineState.x1} y1 = {tempLineState.y1} x2 = {tempLineState.x2} y2 = {tempLineState.y2} /> 
        }

        // connections 
        {lineStates.map(obj => 
          <Connection key = {obj.id} x1 = {obj.x1} y1 = {obj.y1} x2 = {obj.x2} y2 = {obj.y2} /> )}
      </svg>
    )
  }
  export default GraphBase;