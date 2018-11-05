import { default as React } from 'react';
import './Selector.css';

export default function Selector(props) {
    const list = props.list;

    if(list && !list.then) {
        const options = [];

        //currently assumed to be narrative id and title properties from graphql
        list.forEach((item) => {
            options.push(<option key={item._id} value={item._id}>{item.title}</option>);
        });

        return(
          <div>
            <label htmlFor="narrativeSelect" className="sr-only">Narrative</label>
            <select id="narrativeSelect" value={props.selectedItem} onChange={props.action}>
                <option key="noValue" value="">Please select a narrative</option>
                {options}
            </select>
          </div>
        );
    }

    return (
        <div>
            Selector Loading...
        </div>
    );
}