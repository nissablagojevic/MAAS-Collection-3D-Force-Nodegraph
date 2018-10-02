import {default as React} from 'react';

export default function Selector(props) {
    const list = props.list;

    if(list) {
        const options = [];

        //currently assumed to be narrative id and title properties from graphql
        list.forEach((item) => {
            options.push(<option key={item._id} value={item._id}>{item.title}</option>);
        });

        return(
            <select value={props.selectedItem} onChange={props.action}>
                {options}
            </select>
        );
    }

    return (
        <section>
            Loading...
        </section>
    );
}