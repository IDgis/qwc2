/**
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {CHANGE_LOCATE_STATE, LOCATE_ERROR} = require('../actions/locate');
const assign = require('object-assign');

const defaultState = {
    state: "DISABLED"
};

function locate(state = defaultState, action) {
    switch (action.type) {
    case CHANGE_LOCATE_STATE: {
        return assign({}, state, {
            state: action.state
        });
    }
    case LOCATE_ERROR: {
        return assign({}, state, {
            error: action.error
        });
    }
    default:
        return state;
    }

}

module.exports = locate;
