import React, {useEffect, useState, useRef} from 'react';
import Connection from './Connection';
import SimpleNode from './SimpleNode'
const uuid = require('uuid/v4')

function GraphBase (props) {
    const [nodeStates, setNodeStates] = useState([])
    const [lineStates, setLineStates] = useState([])
    const [tempLineState, setTempLineState] = useState({})
    const selectedNodeId = useRef(-1)
    const toggle = useRef(false)
    const isConnectionBeingEstablished = useRef(false)
    useEffect(()=>{
      tempLineState.id = uuid()
      resetTempLineState()
    },[])

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
      if (selectedNodeId.current != -1){
        // get the node specifications
        let nodeObj = nodeStates.find (obj => obj.id == selectedNodeId.current)
        let diffX = e.nativeEvent.offsetX - nodeObj.x
        let diffY = e.nativeEvent.offsetY - nodeObj.y
        nodeObj.x += diffX 
        nodeObj.y += diffY
        setNodeStates([...nodeStates])
        // move the connections that are connected to the node 
        // move the incoming connections
        let change = false;
        if (nodeObj.incomingIds != undefined) {
          let affectedFromLines = lineStates.filter(obj => nodeObj.incomingIds.includes(obj.id))
          affectedFromLines.forEach(line => {line.x2 += diffX; line.y2 += diffY})
          change = true;
        }
        if (nodeObj.outgoingIds != undefined) {
          let affectedToLines = lineStates.filter(obj => nodeObj.outgoingIds.includes(obj.id))
          affectedToLines.forEach(line => {line.x1 += diffX; line.y1 += diffY})
          change = true;
        }
        if (change) setLineStates([...lineStates])
      }
      // connection is being established between two nodes
      // if the pointer is on a potential node then, these properties are already set, dont change them
      if (isConnectionBeingEstablished.current && !toggle.current) {
        tempLineState.x2 = e.nativeEvent.offsetX
        tempLineState.y2 = e.nativeEvent.offsetY
        tempLineState.toId = -1;
        setTempLineState({...tempLineState})
      }
      toggle.current = false;
    }
    
    const onPotentialConnection = (id, x, y) => {
      // if connection hasn't started then dont do anything
      if (tempLineState.fromId == -1) return;
      // snap the connection to the nearest node
      tempLineState.x2 = x
      tempLineState.y2 = y
      tempLineState.toId = id
      toggle.current = true
      setTempLineState({...tempLineState})
    } 

    const onUp = e => {
      tryToEstablishConnection()
      // deselect the node 
      selectedNodeId.current = -1
      resetTempLineState()
      isConnectionBeingEstablished.current = false
    }

    const tryToEstablishConnection = () => {
      if (tempLineState.toId == -1) {
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
      let state = {'id' : uuid(), 'name' : nodeName, 'x' : e.nativeEvent.offsetX, 'y' : e.nativeEvent.offsetY, 
                'outgoingIds' : [], 'incomingIds' : []}
      setNodeStates([...nodeStates, state])
    }

    // save the id of the node that has been selected
    const onNodePointerDown = (id) => {
      selectedNodeId.current = id
    }

    const allowdrop = e=> {
      e.preventDefault();
    }

    return (
      <svg height="100%" width="100%" onDrop={drop} onDragOver={allowdrop} onPointerMove = {onMove} onPointerUp = {onUp}>
        // connections 
        {lineStates.map(obj => 
          <Connection key = {obj.id} x1 = {obj.x1} y1 = {obj.y1} x2 = {obj.x2} y2 = {obj.y2} /> )}
        // nodes
        {nodeStates.map(obj => 
          <SimpleNode key = {obj.id} id = {obj.id} name = {obj.name} x = {obj.x} y = {obj.y} onNodePointerDown = {onNodePointerDown} 
          onInitConnection = {onInitConnection} onPotentialConnection = {onPotentialConnection}/>)}
        <Connection key = {tempLineState.id} x1 = {tempLineState.x1} y1 = {tempLineState.y1} x2 = {tempLineState.x2} y2 = {tempLineState.y2} /> 
      </svg>
    )
  }
  export default GraphBase;