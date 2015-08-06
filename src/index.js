
import { format as formatUrl } from 'url';

import { partial, partialRight, compose, ifElse, is } from 'ramda';
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
 * Return database name from options or default
 *
 * @access  private
 * @param   { String }  [db='test']  DB to connect to mongod
 */
function getDbUrl(db) {
  return db || 'test';
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
  if (options.user && options.password) {
    options.auth = options.user + ':' + options.password;
  }

  return formatUrl({
    protocol: 'mongodb',
    slashes: true,
    hostname: getHost(options.host),
    port: getPort(options.port),
    path: getDbUrl(options.database),
    auth: getAuth(options.auth),
  });
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
  function ExecuteFactory(queryFunc, arg) {
    return {
      exec: function() {
        return Promise.resolve(arg)
          .then(queryFunc);
      },
    };
  }

  function composer(func, hookName) {
    return compose(
      hooks.execAfterHooks(hookName),
      func,
      hooks.execBeforeHooks(hookName)
      );
  }

  /**
   * Find one document
   *
   * @access private
   */
  function findOne(queryObj, opts) {
    return db.collection(collectionName).findOne(queryObj, opts ? opts : {});
  }

  /**
   * Find many documents
   *
   * @access private
   */
  function find(queryObj, opts) {
    return db.collection(collectionName)
      .find(queryObj, opts ? opts : {}).toArray();
  }

  /**
   * Find one document in database
   */
  query.findOne = function(queryObj, opts) {
    return ExecuteFactory(
      composer(partialRight(findOne, opts), 'find'),
      queryObj
      );
  };

  /**
   * Find many documents in database
   */
  query.find = function(queryObj, opts) {
    return ExecuteFactory(
      composer(partialRight(find, opts), 'find'),
      queryObj
      );
  };


  /**
   * Create one document
   *
   * @access  private
   */
  function insertOne(doc, opts) {
    return db.collection(collectionName).insertOne(doc, opts ? opts : {});
  }

  /**
   * Create many documents
   *
   * @access  private
   */
  function insertMany(docs, opts) {
    return db.collection(collectionName).insertMany(docs, opts ? opts : {});
  }

  /**
   * Create one or many documents in database
   */
  query.insert = function(docs, opts) {
    return ExecuteFactory(
      composer(
        ifElse(function() {
            return is(Array, docs);
          },
          partialRight(insertMany, opts),
          partialRight(insertOne, opts)
        ),
        'insert'
      ),
      docs
    );
  };

  /**
   * Update one document
   *
   * @access  private
   */
  function updateOne(queryObj, updates, opts) {
    return db.collection(collectionName)
      .updateOne(queryObj, updates, opts ? opts : {});
  }

  /**
   * Update many documents
   *
   * @access  private
   */
  function updateMany(queryObj, updates, opts) {
    return db.collection(collectionName)
      .updateMany(queryObj, updates, opts ? opts : {});
  }

  /**
   * Update one document in database
   */
  query.updateOne = function(queryObj, updates, opts) {
    return ExecuteFactory(
        composer(partialRight(updateOne, updates, opts), 'update'),
        queryObj
      );
  };

  /**
   * Update many documents in database
   */
  query.updateMany = function(queryObj, updates, opts) {
    return ExecuteFactory(
      composer(partialRight(updateMany, updates, opts), 'update'),
      queryObj
    );
  };

  /**
   * Delete one document
   *
   * @access  private
   */
  function deleteOne(queryObj, opts) {
    return db.collection(collectionName).deleteOne(queryObj, opts ? opts : {});
  }

  /**
   * Delete many documents
   *
   * @access  private
   */
  function deleteMany(queryObj, opts) {
    return db.collection(collectionName).deleteMany(queryObj, opts ? opts : {});
  }

  /**
   * Delete one document in database
   */
  query.deleteOne = function(queryObj, opts) {
    return ExecuteFactory(
      composer(partialRight(deleteOne, opts), 'delete'),
      queryObj
      );
  };

  /**
   * Delete many documents in database
   */
  query.deleteMany = function(queryObj, opts) {
    return ExecuteFactory(
      composer(partialRight(deleteMany, opts), 'delete'),
      queryObj
      );
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
      buildConnectionUrl(options)
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
