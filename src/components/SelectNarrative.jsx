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
        let narrative;
        let location;
        if (!event) {
            if (this.props.selectedNarrative) {
                narrative = this.props.selectedNarrative;
            } else {
                narrative = '';
            }
        } else {
            narrative = parseInt(event.target.value, 10);
            location = {
                pathname: `/${narrative}`,
            };

            this.props.history.push(location)
        }
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
