import { default as React } from 'react';

export default function Instructions(props) {
    return (
        <div className="instructions">
            <h2>Instructions</h2>
            <p>Camera controls:
            Tap &amp; Drag to orbit. Pinch to zoom.
            Tap on a sphere to select that object.</p>
        </div>
    );
}
