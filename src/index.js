
import { format as formatUrl } from 'url';

import { partial, partialRight, ifElse, is } from 'ramda';
import { Promise } from 'es6-promise';
import { MongoClient } from 'mongodb';

import { hooks } from './hooks';

/**
 * Return host from options or default host
 *
 * @access  private
 * @param   { String }  [host=localhost]  Host for connect to mongod
 */
function getHost(host) {
  return host || 'localhost';
}

/**
 * Return port from options or default port
 *
 * @access  private
 * @param   { Number }  [port=27017]  Port for connect to mongod
 */
function getPort(port) {
  return port || 27017;
}

/**
 * Return auth string if auth is passed
 *
 * @access  private
 * @param   { Object }  auth            Object with auth params
 * @param   { String }  auth.user       Name of user for auth
 * @param   { String }  auth.password   Password for user authentication
 */
function getAuth(auth) {
  const password = auth && auth.password ? ':' + auth.password : '';

  return auth ? auth.user + password : null;
}

/**
 * Create url from passed options or use default values. See `getAuth`,
 * `getHost` and `getPort`
 *
 * @access  private
 * @param   { Object }  options         Object for build url for connecting to
 * mongodb
 * @param   { String }  options.host    Host for connect
 * @param   { String }  options.port    Port for connect
 * @param   { Object }  options.auth    Object for auth connecting. User and
 * password options
 */
function buildConnectionUrl(options) {
  /*if (options.user && options.password) {
    options.auth = options.user + ':' + options.password;
  }*/

  return formatUrl({
    protocol: 'mongodb',
    slashes: true,
    hostname: getHost(options.host),
    port: getPort(options.port),
    //auth: getAuth(options.auth),
  });
}

/**
 * Create collection in database
 *
 * @param { MongoClient.Db }  db              Instance if database
 * @param { String }          collectionName  Name of collection
 */
function createCollection(db, collectionName) {
  return db.createCollection(collectionName);
}

/**
 * Return Query Interface
 *
 * @access  private
 * @param   { Mongodb.Db }  db              Instance of database
 * @param   { String }      collectionName  Name of collection in mongodb
 */
function QueryFactory(db, collectionName) {
  const query = {};

  /**
   * Return executor
   */
  function ExecuteFactory(queryFunc, hookName) {
    return {
      exec: function() {
        return queryFunc()
          .then(hooks.execHooks(hookName)('after'));
      },
    };
  }

  /**
   * Find one document
   *
   * @access private
   */
  function findOne(queryObj, opts) {
    return function() {
      return Promise.resolve(queryObj)
        .then(hooks.execHooks('find')('before'))
        .then(function(data) {
          return db.collection(collectionName).findOne(data, opts ? opts : {});
        });
    };
  }

  /**
   * Find many documents
   *
   * @access private
   */
  function find(queryObj, opts) {
    return function() {
      return Promise.resolve(queryObj)
        .then(hooks.execHooks('find')('before'))
        .then(function(data) {
          return db.collection(collectionName).find(data, opts ? opts : {});
        })
        .then(function(cursor) {
          return cursor.toArray();
        });
    };
  }

  /**
   * Find one document in database
   */
  query.findOne = function(queryObj, opts) {
    return ExecuteFactory(findOne(queryObj, opts), 'find');
  };

  /**
   * Find many documents in database
   */
  query.find = function(queryObj, opts) {
    return ExecuteFactory(find(queryObj, opts), 'find');
  };


  /**
   * Create one document
   *
   * @access  private
   */
  function createOne(doc, opts) {
    return function() {
      return Promise.resolve(doc)
        .then(hooks.execHooks('create')('before'))
        .then(function(data) {
          return db.collection(collectionName).insertOne(data, opts ? opts : {});
        });
    };
  }

  /**
   * Create many documents
   *
   * @access  private
   */
  function createMany(docs, opts) {
    return function() {
      return Promise.resolve(docs)
        .then(hooks.execHooks('create')('before'))
        .then(function(data) {
          return db.collection(collectionName).insertMany(data, opts ? opts : {});
        });
    };
  }

  /**
   * Create one or many documents in database
   */
  query.insert = function(docs, opts) {
    return ExecuteFactory(
      docs instanceof Array ? createMany(docs, opts) : createOne(docs, opts),
      'create');
  };

  /**
   * Update one document
   *
   * @access  private
   */
  function updateOne(queryObj, updates, opts) {
    return function() {
      return Promise.resolve(queryObj)
        .then(hooks.execHooks('update')('before'))
        .then(function(data) {
          return  db.collection(collectionName).updateOne(data, updates, opts ? opts : {});
        });
    };
  }

  /**
   * Update many documents
   *
   * @access  private
   */
  function updateMany(queryObj, updates, opts) {
    return function() {
      return Promise.resolve(queryObj)
        .then(hooks.execHooks('update')('before'))
        .then(function(data) {
          return  db.collection(collectionName).updateMany(data, updates, opts ? opts : {});
        });
    };
  }

  /**
   * Update one document in database
   */
  query.updateOne = function(queryObj, updates, opts) {
    return ExecuteFactory(updateOne(queryObj, updates, opts), 'update');
  };

  /**
   * Update many documents in database
   */
  query.updateMany = function(queryObj, updates, opts) {
    return ExecuteFactory(updateMany(queryObj, updates, opts), 'update');
  };

  /**
   * Delete one document
   *
   * @access  private
   */
  function deleteOne(queryObj, opts) {
    return function() {
      return Promise.resolve(queryObj)
        .then(hooks.execHooks('delete')('before'))
        .then(function(data) {
          return  db.collection(collectionName).deleteOne(data, opts ? opts : {});
        });
    };
  }

  /**
   * Delete many documents
   *
   * @access  private
   */
  function deleteMany(queryObj, opts) {
    return function() {
      return Promise.resolve(queryObj)
        .then(hooks.execHooks('delete')('before'))
        .then(function(data) {
          return  db.collection(collectionName).deleteMany(data, opts ? opts : {});
        });
    };
  }

  /**
   * Delete one document in database
   */
  query.deleteOne = function(queryObj, opts) {
    return ExecuteFactory(deleteOne(queryObj, opts), 'delete');
  };

  /**
   * Delete many documents in database
   */
  query.deleteMany = function(queryObj, opts) {
    return ExecuteFactory(deleteMany(queryObj, opts), 'delete');
  };

  return query;
}

/**
 * Create Mongodb ODM adapter
 */
export function Factory(options) {
  const adapter = {};

  adapter.query = function(db, collectionName) {
    return QueryFactory(db, collectionName);
  };

  adapter.close = function(db) {
    return db.close();
  };

  adapter.connect = function() {
    return MongoClient.connect(
      buildConnectionUrl(options) + '/' + options.database
    ).then(function(db) {

      adapter.getDatabase = function() {
        return db;
      };

      adapter.query = partial(adapter.query, db);
      adapter.close = partial(adapter.close, db);

      return adapter;
    });
  };

  return adapter;
}
