import { default as React } from 'react';
import './Instructions.css';

export default function Instructions(props) {
    return (
        <div id="instructions" className="info">
            <h3>Instructions:</h3>
            <p>Select a narrative above</p>
            <p>Camera controls -
            Tap &amp; Drag to orbit. Pinch to zoom.
            Tap on a sphere to select that object.</p>
        </div>
    );
}
