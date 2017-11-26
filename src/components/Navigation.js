import { default as React } from 'react';

import { Link } from 'react-router-dom';

import { Navbar, Nav, NavItem } from 'react-bootstrap';

function Navigation(props) {
    var prefix = '/';
    if (props.development === 'production') {
        prefix = '/maas/';
    }

    return (
        <Navbar fluid>
            <Navbar.Header>
                <Navbar.Brand>
                    <Link to={prefix}>NodeGraph</Link>
                </Navbar.Brand>
            </Navbar.Header>
            <Nav>
                <NavItem href={prefix + 'about'}>About</NavItem>
            </Nav>
        </Navbar>
    );
}

export default Navigation;
