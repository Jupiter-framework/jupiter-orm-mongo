# jupiter-orm-mongo

[![Build Status](https://travis-ci.org/zoilorys/jupiter-orm-mongo.svg?branch=master)](https://travis-ci.org/zoilorys/jupiter-orm-mongo)[![Coverage Status](https://coveralls.io/repos/zoilorys/jupiter-orm-mongo/badge.svg?branch=master&service=github)](https://coveralls.io/github/zoilorys/jupiter-orm-mongo?branch=master)

## API

#### .Factory(options)

Returns adapter API object.

**Arguments**<br />
{ Object } **options** - object with properties for connection.

Available options:<br />
{ String } **host** - host name without protocol, e.g. '127.0.0.1'<br />
{ Number } **port** - port of host server to connect<br />
{ String } **database** - database name of DB to connect<br />

**Example**
```javascript
let ORM = Factory({
  host: '127.0.0.1',
  post: 27017,
  database: 'test',
});
```

#### .connect()

Establish connection to DB. Returns adapter object.

**Example**
```javascript
let ORM = Factory({
  // options
}).connect();

```

#### .query(collection)

Returns Query interface of adapter for selected collection.

**Arguments**<br />
{ String } **collection** - name of collection to query.

**Example**
```javascript
Factory({
  // options
}).connect().query('collection')
    .find().exec()
    .then(console.log.bind(console));
});
```

#### .close()

Closes current connection.

**Example**
```javascript
Factory({
  // options
}).connect().query('collection').find().exec().then(function(result) {
    doSomethingWith(result);
    ORM.close();
  });
});

```

### Query API

#### .find(query, opts)

Returns list of documents from collection, by query clause.

**Arguments**<br />
{ Object } **query** - object, that contains query сonditions.<br />
{ Object } **opts** - options for search, e.g. sort, limit, skip.

**Example**
```javascript
let Query = Factory({
  // options
}).connect().query('collection')

Query.find({
  query: 'clause'
}).exec().then(console.log.bind(console));

```

#### .findOne(query, opts)

Return document from collection, by query clause

**Arguments**<br />
{ Object } **query** - object, that contains query сonditions.<br />
{ Object } **opts** - options for search, e.g. sort, limit, skip.

**Example**
```javascript
let Query = Factory({
  // options
}).connect().query('collection')

Query.findOne({
  query: 'clause'
}).exec().then(console.log.bind(console));
```

#### .insert(document, opts)

Insert one or many documents into collection

**Arguments**<br />
{ Object | Array } **document** - document or documents list for inserting<br />
{ Object }         **opts** - additional options.

**Example**
```javascript
let Query = Factory({
  // options
}).connect().query('collection');

Query.insert({key: 'value'}).exec().then(console.log.bind(console));
Query.insert([{key1: 'value1'}, {key2: 'value2'}])
  .exec().then(console.log.bind(console));

```

#### .deleteOne(query, opts)

Remove one document from collection

**Arguments**<br />
{ Object } **query** - selector clause for removing<br />
{ Object } **opts** - additional options.

**Example**
```javascript
let Query = Factory({
  // options
}).connect().query('collection');

Query.deleteOne({key: 'value'}).exec().then(console.log.bind(console));

```

#### .deleteMany(query, opts)

Remove many documents from collection

**Arguments**<br />
{ Object } **query** -  selector clause for removing<br />
{ Object } **opts** - additional options.

**Example**
```javascript
let Query = Factory({
  // options
}).connect().query('collection');

Query.deleteMany({key: 'value'}).exec().then(console.log.bind(console));

```

#### .updateOne(query, value, opts)

Update one document from collection

**Arguments**<br />
{ Object } **query** - selector clause for updating<br />
{ Object } **value** - updated value for document<br />
{ Object } **opts** - additional options

**Example**
```javascript
let Query = Factory({
  // options
}).connect().query('collection');

Query.updateOne({key: 'value', { key: 'changedValue' }})
  .exec().then(console.log.bind(console));
```

#### .updateMany(filter, values, opts)

Update all documents from collection

**Arguments**<br />
{ Object } **filter** - selector clause for updating<br />
{ Object } **values** - updated value for documents<br />
{ Object } **opts** - additional options

**Example**
```javascript
let Query = Factory({
  // options
}).connect().query('collection');

Query.updateMany({key1: 'value1'}, { key: 'changedValue' })
  .exec().then(console.log.bind(console));
```

#### .exec()

Executes query and returns Promise object.

**Example**
```javascript
let ORM = Factory({
  // options
});

ORM.connect().query('test_items').find()
  .exec()
  .then(function(result) {
    doSomethingWith(result);
    ORM.close();
  });
```
