import { actionTypes, setResourceMeta } from 'redux-resource';

// End actions can be failed, succeeded, or idle. Idle should be dispatched
// when the request is aborted (with a status code of 0).
const createEndActions = [
  actionTypes.CREATE_RESOURCES_FAILED,
  actionTypes.CREATE_RESOURCES_SUCCEEDED,
  actionTypes.CREATE_RESOURCES_IDLE,
];

const readEndActions = [
  actionTypes.READ_RESOURCES_FAILED,
  actionTypes.READ_RESOURCES_SUCCEEDED,
  actionTypes.READ_RESOURCES_IDLE,
];

const updateEndActions = [
  actionTypes.UPDATE_RESOURCES_FAILED,
  actionTypes.UPDATE_RESOURCES_SUCCEEDED,
  actionTypes.UPDATE_RESOURCES_IDLE,
];

const deleteEndActions = [
  actionTypes.DELETE_RESOURCES_FAILED,
  actionTypes.DELETE_RESOURCES_SUCCEEDED,
  actionTypes.DELETE_RESOURCES_IDLE,
];

// This sets a new meta property on resource and request metadata: `statusCode`.
// This will be equal to the last status code for a request
export default function httpStatusCodes(resourceType) {
  return function(state, action) {
    const typeToCheck = action.resourceType || action.resourceName;
    if (typeToCheck !== resourceType) {
      return state;
    }

    const isCreateEndAction = createEndActions.indexOf(action.type) !== -1;
    const isReadEndAction = readEndActions.indexOf(action.type) !== -1;
    const isUpdateEndAction = updateEndActions.indexOf(action.type) !== -1;
    const isDeleteEndAction = deleteEndActions.indexOf(action.type) !== -1;

    if (
      !isCreateEndAction &&
      !isReadEndAction &&
      !isUpdateEndAction &&
      !isDeleteEndAction
    ) {
      return state;
    }

    const statusCode =
      typeof action.statusCode === 'number' ? action.statusCode : null;
    const resources = action.resources;

    let request;

    const naiveKey = action.requestKey || action.request;
    if (naiveKey && typeof naiveKey === 'string') {
      request = naiveKey;
    }

    let newRequests, newMeta, idList;
    if (resources) {
      idList = resources.map(r => {
        if (typeof r === 'object') {
          return r.id;
        } else {
          return r;
        }
      });
    } else {
      idList = [];
    }

    if (request) {
      const existingRequest = state.requests[request] || {};

      newRequests = {
        ...state.requests,
        [request]: {
          ...existingRequest,
          statusCode,
        },
      };
    } else {
      newRequests = { ...state.requests };
    }

    if (idList.length) {
      let metaPrefix;
      if (isCreateEndAction) {
        metaPrefix = 'create';
      } else if (isReadEndAction) {
        metaPrefix = 'read';
      } else if (isUpdateEndAction) {
        metaPrefix = 'update';
      } else if (isDeleteEndAction) {
        metaPrefix = 'delete';
      }

      newMeta = setResourceMeta({
        meta: state.meta,
        newMeta: {
          [`${metaPrefix}StatusCode`]: statusCode,
        },
        resources: idList,
        mergeMeta: true,
      });
    } else {
      newMeta = state.meta;
    }

    return {
      ...state,
      requests: newRequests,
      meta: newMeta,
    };
  };
}
