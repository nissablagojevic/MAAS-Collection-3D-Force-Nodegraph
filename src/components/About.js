import { default as React } from 'react';

export default function About(props) {
    var packageJson = `{
  "name": "collectionnodegraph",
  "version": "0.1.0",
  }`;
    return (
        <section>
            <h2>About</h2>
            <pre>
        {packageJson}
            </pre>
        </section>
    );
}
