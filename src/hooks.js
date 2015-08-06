import { isEmpty } from 'ramda';

function hooksManager() {
  const hooks = {
    insert: {
      before: [],
      after: [],
    },
    update: {
      before: [],
      after: [],
    },
    find: {
      before: [],
      after: [],
    },
    delete: {
      before: [],
      after: [],
    },
  };

  const controller = {};

  controller.registerBeforeHook = function(name, hook) {
    hooks[name]['before'].push(hook);
    return this;
  };

  controller.registerAfterHook = function(name, hook) {
    hooks[name]['after'].push(hook);
    return this;
  };

  controller.execBeforeHooks = function(name) {
    return function(value) {
      return isEmpty(hooks[name]['before']) ? value : hooks[name]['before']
        .reduce(function(value, func) {
          return func(value);
        }, value);
    };
  };

  controller.execAfterHooks = function(name) {
    return function(value) {
      return isEmpty(hooks[name]['after']) ? value : hooks[name]['after']
        .reduce(function(value, func) {
          return func(value);
        }, value);
    };
  };

  controller.clearHooks = function(name) {
    Object.keys(hooks[name]).map(function(item) {
      hooks[name][item].length = 0;
    });
    return this;
  }

  return controller;
};

export const hooks = hooksManager();
