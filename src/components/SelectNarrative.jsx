import { default as React, Component } from 'react';
import {sourceUrl, narrativesList} from './resolvers.js';

import Selector from './Selector';
import Instructions from './Instructions';

class SelectNarrative extends Component {
    constructor() {
        super();
        this.state = {
            selectedNarrative: ''
        };

        this.selectNarrative = this.selectNarrative.bind(this);
    }

    componentDidMount() {
        this.selectNarrative();

    }

    selectNarrative(event) {
        console.log("SELECTNARRATIVE");
        console.log(this.props);
        console.log(this.state);
        console.log(event);
        let narrative;
        let location;
        if (!event) {
            if (this.props.selectedNarrative) {
                narrative = this.props.selectedNarrative;
            } else {
                narrative = '';
            }
        } else {
            console.log(event.target);
            console.log(event.target.value);
            narrative = parseInt(event.target.value, 10);
            location = {
                pathname: `/${narrative}`,
            };

            this.props.history.push(location)

        }
        // @TODO Broke the select again, only gives the default 2087 again
        this.setState({selectedNarrative: narrative});
    }

    render() {
        return (
            <div className="narrativeSelect">
                <h3>Narrative:</h3>
                <Selector
                    selectedItem={this.props.selectedNarrative}
                    list={this.props.narrativesList}
                    action={this.selectNarrative}/>
                <Instructions/>
            </div>
        );
    }
}

export default SelectNarrative;
