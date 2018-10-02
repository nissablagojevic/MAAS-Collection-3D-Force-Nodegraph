import { default as React } from 'react';

export default function Instructions(props) {
    return (
        <div className="instructions">
            <h3>Instructions:</h3>
            <p>Select a narrative above</p>
            <p>Camera controls -
            Tap &amp; Drag to orbit. Pinch to zoom.
            Tap on a sphere to select that object.</p>
        </div>
    );
}
