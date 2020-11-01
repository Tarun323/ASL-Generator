import React, {useEffect, useState, useRef} from 'react';

const Connection = React.memo(props => {
    return (
        <line class="line" x1={props.x1} y1 = {props.y1} x2 = {props.x2} y2 = {props.y2} />
    )
})
export default Connection;