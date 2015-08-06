
import { expect } from 'chai';
import { Promise } from 'es6-promise';
import { Db } from 'mongodb';

import { Factory } from '../src/index';
import { hooks } from '../src/hooks';

describe('API spec', function() {
  const Adapter = Factory();

  it('Adapter object API', function() {
    expect(Adapter).to.have.all.keys('connect', 'close', 'query');

    [
      Adapter.connect,
      Adapter.close,
      Adapter.query,
    ].forEach(function(func) {
      expect(func).to.be.ok.and.to.be.a('function');
    });
  });


  it('Query object API', function() {
    const Query = Factory().query();

    expect(Query).to.have.all.keys('insert', 'find', 'findOne', 'deleteOne', 'deleteMany', 'updateOne', 'updateMany');

    [
      Query.insert,
      Query.find,
      Query.findOne,
      Query.updateOne,
      Query.updateMany,
      Query.deleteOne,
      Query.deleteMany,
    ].forEach(function(func) {
      expect(func).to.be.ok.and.to.be.a('function');
    });
  });
});

describe('Connection behavior', function() {
  it('should be connected and disconnected', function(done) {
    const connectedFactory = Factory({
      database: 'test',
    });

    connectedFactory.connect().catch(done).then(function(adapter) {
      expect(adapter.getDatabase()).to.be.instanceof(Db);
      adapter.close().catch(done).then(done);
    });
  });
});

describe('Create documents', function() {
  const Adapter = Factory({
    database: 'test',
  });

  before(function(done) {
    Adapter.connect().catch(done).then(function() {
      done();
    });
  });

  it('should return Promise', function() {
    const Query = Adapter.query('orm_test');

    expect(Query.insert({
      key: 'value'
    }).exec()).to.be.instanceof(Promise);

    expect(Query.insert([{
      key: 'value'
    },
    {
      key: 'value'
    }]).exec()).to.be.instanceof(Promise);

  });
});

describe('Read documents', function() {
  const Adapter = Factory({
    database: 'test',
  });

  before(function(done) {
    Adapter.connect().catch(done).then(function() {
      done();
    });
  });

  it('should return Promise and be equal inserted data', function(done) {
    const Query = Adapter.query('orm_test');
    Promise.resolve(null)
    .then(function() {
      return Query.find({
        key: 'value'
      }).exec().then(function(data) {
        expect(data.slice).to.be.ok.and.to.be.a('function');
        expect(data[0].key).to.be.ok.and.to.be.eql('value');
      });
    })
    .then(function() {
      Query.findOne({
        key: 'value'
      }).exec().then(function(data) {
        expect(data.key).to.be.ok.and.to.be.eql('value');
        Adapter.close();
        done();
      });
    });
  });
});

describe('Update documents', function(done) {
  const Adapter = Factory({
    database: 'test',
  });

  before(function(done) {
    Adapter.connect().catch(done).then(function() {
      done();
    });
  });

  it('should return Promise and data must be updated', function(done) {
    const Query = Adapter.query('orm_test');

    Promise.resolve(null).then(function() {
      return Query.updateMany({
        key: 'value',
      }, {
        $set: {
          param: 'value',
        }
      }).exec().then(function(data) {
        expect(data.modifiedCount).to.be.ok.and.to.be.not.equal(0);
      });
    }).then(function() {
      return Query.updateOne({
        key: 'value',
      }, {
        $set: {
          only: 'value',
        }
      }).exec().then(function(data) {
        expect(data.modifiedCount).to.be.ok.and.to.be.not.equal(0);
        Adapter.close();
        done();
      });
    });
  });
});

describe('Delete documents', function(done) {
  const Adapter = Factory({
    database: 'test',
  });

  before(function(done) {
    Adapter.connect().catch(done).then(function() {
      done();
    });
  });

  it('should return Promise and data must be deleted', function(done) {
    const Query = Adapter.query('orm_test');

    Promise.resolve(null)
      .then(function() {
        const result = Query.deleteOne({
          key: 'value',
        }).exec().then(function(data) {
          expect(data.deletedCount).to.be.ok.and.to.be.eql(1);
          expect(result).to.be.instanceof(Promise);
        });
      }).then(function() {
        const result = Query.deleteMany({
          key: 'value',
        }).exec().then(function(data) {
          expect(data.deletedCount).to.be.ok.and.to.be.eql(2);
          expect(result).to.be.instanceof(Promise);
          Adapter.close();
          done();
        });
      });
  });
});

describe('Hooks test', function() {
  const Adapter = Factory({
    database: 'test',
  });

  before(function(done) {
    Adapter.connect().catch(done).then(function() {
      done();
    });
  });

  it('Hooks should process passing data', function(done) {
    const Query = Adapter.query('orm_test');

    hooks.registerBeforeHook('insert', function(value) {
      value.before = 'before';
      return value;
    });
    hooks.registerAfterHook('insert', function(value) {
      return value.insertedCount;
    });

    hooks.registerBeforeHook('find', function(value) {
      value.key = 'value';
      return value;
    });
    hooks.registerAfterHook('find', function(value) {
      value.after = 'after';
      return value;
    });

    Query.insert({
      key: 'value',
    }).exec().then(function(data) {
      expect(data).to.be.ok.and.to.be.eql(1);
    });

    Query.findOne({}).exec().then(function(data) {
      expect(data.key).to.be.ok.and.to.be.eql('value');
      expect(data.before).to.be.ok.and.to.be.eql('before');
      expect(data.after).to.be.ok.and.to.be.eql('after');
      clearHooks('insert');
      clearHooks('find')
    });

    Query.deleteMany({
      key: 'value',
    }).exec().then(function(data) {
      Adapter.close();
      done();
    });
  });
});
