import { default as React } from 'react';
import './InfoList.css';

function isImageUrl(url) {
    //http or https url format ending in common image file types
    const expression = /[-a-zA-Z0-9@:%_+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_+.~#?&//=]*)?\.(?:jpg|gif|png)/gi;
    const regex = new RegExp(expression);
    if (url.match(regex)) {
        return true;
    }
    return false;
}

export default function InfoList(props) {
    const property = props.list;

    //@TODO abstract this and map attributes back to the graphql schema
    //you're totally going to write that at some point. Right?
    if (property) {
        if (typeof property === 'object') {
            return Object.entries(property).map(([key,value])=>{
                let result = null;

                if (typeof value === 'object') {
                    if (key === parseInt(key, 10).toString()) {
                        result = <InfoList key={'InfoList-' + key} list={value}/>;
                    } else {
                        result =
                            <li key={key} id={key}>
                                <span className="key">{key}</span> :
                                <ul className="child">
                                    <InfoList key={'InfoList-' + key} list={value}/>
                                </ul>
                            </li>;
                    }
                } else {
                    //don't display empty fields
                    if (key && value) {
                        if (key === parseInt(key, 10).toString()) {
                            result =
                                <li key={key} id={key}>{value.toString()}</li>;
                        } else {
                            //special case for the images
                            if (key === 'url' && isImageUrl(value)) {
                                //@TODO add more meaningful alt text property derived from object titles
                                result =
                                    <li key={key} id={key}>
                                        <img src={value} alt=""/>
                                    </li>;
                            } else {
                                result =
                                    <li key={key} id={key}>
                                        <span className="key">{key}</span>
                                        : {value.toString()}
                                    </li>;
                            }
                        }
                    }
                }

                return result;
            });
        }
    }

    return null;
}